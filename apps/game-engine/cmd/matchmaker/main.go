package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"

	"riffle/game-engine/internal/hub"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
)

func main() {
	h := hub.NewHub()
	instanceID := uuid.New().String()

	redisAddr := strings.TrimSpace(os.Getenv("REDIS_ADDR"))
	if redisAddr == "" {
		if host := strings.TrimSpace(os.Getenv("REDIS_HOST")); host != "" {
			redisAddr = host + ":6379"
		}
	}
	if redisAddr != "" {
		rdb := redis.NewClient(&redis.Options{Addr: redisAddr})
		if err := rdb.Ping(context.Background()).Err(); err != nil {
			log.Printf("redis %s unavailable, multi-instance fan-out disabled: %v", redisAddr, err)
		} else {
			h.ConfigureRedis(rdb, instanceID)
			log.Printf("redis fan-out enabled (instance id %s)", instanceID)
			go func() {
				h.RunRedisSubscriber(context.Background())
			}()
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	upgrader := websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin:     makeCheckOrigin(),
	}

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"ok":true,"service":"matchmaker"}`))
	})

	http.HandleFunc("/lobbies", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
			return
		}
		h.ServeLobbyList(w, r)
	})

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		h.ServeWS(w, r, upgrader)
	})

	addr := ":" + port
	log.Printf("matchmaker listening on %s (GET /health, /lobbies, /ws)", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}

// makeCheckOrigin returns a permissive checker when WEBSOCKET_ALLOWED_ORIGINS is empty (local dev).
// In production set e.g. WEBSOCKET_ALLOWED_ORIGINS=https://app.example.com,http://localhost:5173
func makeCheckOrigin() func(r *http.Request) bool {
	raw := os.Getenv("WEBSOCKET_ALLOWED_ORIGINS")
	if strings.TrimSpace(raw) == "" {
		return func(r *http.Request) bool { return true }
	}
	allowed := make(map[string]struct{})
	for _, p := range strings.Split(raw, ",") {
		p = strings.TrimSpace(p)
		if p != "" {
			allowed[p] = struct{}{}
		}
	}
	return func(r *http.Request) bool {
		o := r.Header.Get("Origin")
		if o == "" {
			return true
		}
		_, ok := allowed[o]
		return ok
	}
}
