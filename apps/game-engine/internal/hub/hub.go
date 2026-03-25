package hub

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"riffle/game-engine/internal/auth"

	"github.com/gorilla/websocket"
)

var roomCodeRe = regexp.MustCompile(`^[A-Z0-9]{6}$`)

var colorPool = []string{
	"purple-500", "blue-500", "green-500", "yellow-500", "fuchsia-500", "cyan-500",
}

// Player mirrors the client lobby shape (room-sim.js).
type Player struct {
	ClientID string `json:"clientId"`
	Username string `json:"username"`
	Avatar   string `json:"avatar"`
	Ready    bool   `json:"ready"`
	Color    string `json:"color"`
	UserID   *int64 `json:"userId,omitempty"`
}

// Hub holds all live rooms (in-memory; scale-out later with Redis).
type Hub struct {
	mu    sync.RWMutex
	rooms map[string]*Room
}

func NewHub() *Hub {
	return &Hub{rooms: make(map[string]*Room)}
}

type Room struct {
	ID         string
	HostID     string
	Required   int
	Started    bool
	StartedAt  int64
	Players    map[string]*Player
	joinOrder  []string
	clients    map[string]*Client
	mu         sync.RWMutex
}

type Client struct {
	hub      *Hub
	room     *Room
	roomID   string
	clientID string
	conn     *websocket.Conn
	send     chan []byte
	once     sync.Once
}

func (h *Hub) getOrCreateRoom(roomID string, required int) *Room {
	h.mu.Lock()
	defer h.mu.Unlock()
	if r, ok := h.rooms[roomID]; ok {
		if required > 0 && r.Required != required {
			r.Required = required
		}
		return r
	}
	if required < 1 {
		required = 2
	}
	if required > 20 {
		required = 20
	}
	r := &Room{
		ID:        roomID,
		Required:  required,
		Players:   make(map[string]*Player),
		clients:   make(map[string]*Client),
		joinOrder: nil,
	}
	h.rooms[roomID] = r
	return r
}

func (h *Hub) deleteRoomIfEmpty(roomID string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	r, ok := h.rooms[roomID]
	if !ok {
		return
	}
	r.mu.Lock()
	empty := len(r.clients) == 0
	r.mu.Unlock()
	if empty {
		delete(h.rooms, roomID)
	}
}

// ServeWS upgrades to WebSocket and registers the client.
func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request, upgrader websocket.Upgrader) {
	q := r.URL.Query()
	rawRoom := strings.TrimSpace(q.Get("room"))
	roomID := NormalizeRoomCode(rawRoom)
	if len(roomID) != 6 || !roomCodeRe.MatchString(roomID) {
		http.Error(w, `{"error":"invalid room"}`, http.StatusBadRequest)
		return
	}

	clientID := strings.TrimSpace(q.Get("clientId"))
	if clientID == "" || len(clientID) > 64 {
		http.Error(w, `{"error":"invalid clientId"}`, http.StatusBadRequest)
		return
	}

	name := strings.TrimSpace(q.Get("name"))
	if name == "" {
		name = "Guest"
	}
	if len(name) > 40 {
		name = name[:40]
	}
	avatar := strings.TrimSpace(q.Get("avatar"))
	if avatar == "" {
		avatar = "avatar1"
	}
	if len(avatar) > 32 {
		avatar = avatar[:32]
	}

	required := 2
	if rs := q.Get("required"); rs != "" {
		if n, err := strconv.Atoi(rs); err == nil && n > 0 {
			required = n
		}
	}
	if required > 20 {
		required = 20
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "riffle_dev_jwt_secret"
	}
	var userID *int64
	if tok := q.Get("token"); tok != "" {
		if id, err := auth.ParseUserID(tok, jwtSecret); err == nil {
			userID = new(int64)
			*userID = id
		}
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("websocket upgrade: %v", err)
		return
	}

	room := h.getOrCreateRoom(roomID, required)
	room.mu.Lock()
	if room.HostID == "" {
		room.HostID = clientID
	}
	color := colorPool[len(room.joinOrder)%len(colorPool)]
	p := &Player{
		ClientID: clientID,
		Username: name,
		Avatar:   avatar,
		Ready:    true,
		Color:    color,
		UserID:   userID,
	}
	room.Players[clientID] = p
	room.joinOrder = append(room.joinOrder, clientID)

	c := &Client{
		hub:      h,
		room:     room,
		roomID:   roomID,
		clientID: clientID,
		conn:     conn,
		send:     make(chan []byte, 32),
	}
	room.clients[clientID] = c
	room.mu.Unlock()

	go c.writePump()
	go c.readPump()
	c.hub.broadcastRoomStateFor(c.room)
}

// NormalizeRoomCode uppercases and strips to A–Z / 0–9 only (no padding).
func NormalizeRoomCode(s string) string {
	s = strings.ToUpper(strings.TrimSpace(s))
	var b strings.Builder
	for _, r := range s {
		if (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
		}
	}
	return b.String()
}

func (h *Hub) broadcastRoomStateFor(room *Room) {
	room.mu.RLock()
	players := make([]Player, 0, len(room.joinOrder))
	for _, id := range room.joinOrder {
		if p, ok := room.Players[id]; ok {
			players = append(players, *p)
		}
	}
	msg := map[string]any{
		"type":            "room_state",
		"roomId":          room.ID,
		"requiredCount":   room.Required,
		"hostClientId":    room.HostID,
		"started":         room.Started,
		"players":         players,
	}
	payload, _ := json.Marshal(msg)
	clients := make([]*Client, 0, len(room.clients))
	for _, cl := range room.clients {
		clients = append(clients, cl)
	}
	room.mu.RUnlock()

	broadcastToClients(clients, payload)
}

func broadcastToClients(clients []*Client, payload []byte) {
	for _, cl := range clients {
		select {
		case cl.send <- payload:
		default:
			log.Printf("client send buffer full, dropping broadcast")
		}
	}
}

func (c *Client) writePump() {
	defer func() {
		c.conn.Close()
	}()
	for msg := range c.send {
		c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
		if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			return
		}
	}
}

func (c *Client) readPump() {
	defer c.unregister()
	c.conn.SetReadLimit(8192)
	_ = c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		_ = c.conn.SetReadDeadline(time.Now().Add(120 * time.Second))
		return nil
	})

	for {
		_, data, err := c.conn.ReadMessage()
		if err != nil {
			break
		}
		var m struct {
			Type string `json:"type"`
			Ready *bool `json:"ready,omitempty"`
		}
		if err := json.Unmarshal(data, &m); err != nil {
			continue
		}
		switch m.Type {
		case "ping":
			c.replyPong()
		case "ready":
			if m.Ready != nil {
				c.setReady(*m.Ready)
			}
		case "start_game":
			c.tryStartGame()
		}
	}
}

func (c *Client) replyPong() {
	b, _ := json.Marshal(map[string]string{"type": "pong"})
	select {
	case c.send <- b:
	default:
	}
}

func (c *Client) setReady(ready bool) {
	c.room.mu.Lock()
	if p, ok := c.room.Players[c.clientID]; ok {
		p.Ready = ready
	}
	c.room.mu.Unlock()
	c.hub.broadcastRoomStateFor(c.room)
}

func (c *Client) tryStartGame() {
	c.room.mu.Lock()
	host := c.room.HostID == c.clientID
	count := len(c.room.Players)
	req := c.room.Required
	started := c.room.Started
	if host && !started && count >= req {
		c.room.Started = true
		c.room.StartedAt = time.Now().UnixMilli()
	}
	shouldBroadcast := c.room.Started && !started
	c.room.mu.Unlock()
	if shouldBroadcast {
		c.hub.broadcastRoomStateFor(c.room)
		c.broadcastGameStarted()
	}
}

func (c *Client) broadcastGameStarted() {
	msg := map[string]any{
		"type":   "game_started",
		"roomId": c.room.ID,
		"by":     c.clientID,
	}
	payload, _ := json.Marshal(msg)
	room := c.room
	room.mu.RLock()
	clients := make([]*Client, 0, len(room.clients))
	for _, cl := range room.clients {
		clients = append(clients, cl)
	}
	room.mu.RUnlock()
	broadcastToClients(clients, payload)
}

func (c *Client) unregister() {
	c.once.Do(c.doUnregister)
}

func (c *Client) doUnregister() {
	room := c.room
	roomID := c.roomID
	clientID := c.clientID

	room.mu.Lock()
	delete(room.Players, clientID)
	delete(room.clients, clientID)
	newOrder := make([]string, 0, len(room.joinOrder))
	for _, id := range room.joinOrder {
		if id != clientID {
			newOrder = append(newOrder, id)
		}
	}
	room.joinOrder = newOrder
	if room.HostID == clientID && len(newOrder) > 0 {
		room.HostID = newOrder[0]
	} else if len(newOrder) == 0 {
		room.HostID = ""
	}
	room.mu.Unlock()

	_ = c.conn.Close()
	close(c.send)
	c.hub.deleteRoomIfEmpty(roomID)

	c.hub.mu.RLock()
	r, ok := c.hub.rooms[roomID]
	c.hub.mu.RUnlock()
	if ok {
		c.hub.broadcastRoomStateFor(r)
	}
}
