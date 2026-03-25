# Matchmaker (Go) — durum ve yol haritası

Bu dosya `apps/game-engine` içindeki gerçek zamanlı lobi / matchmaker servisinin **son yapılanları** ve **yapılacakları** özetler. Mimari çerçeve için bkz. [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Son yapılanlar

### Go servisi (`apps/game-engine`)

- **HTTP**
  - `GET /health` — JSON: `{"ok":true,"service":"matchmaker"}`
- **WebSocket** — `GET /ws` (query parametreleri)
  - `room` — 6 karakter `[A-Z0-9]` oda kodu
  - `clientId` — istemci kimliği (yeniden bağlantı için)
  - `name`, `avatar`, `required` — lobi gereksinimleri
  - `token` — isteğe bağlı JWT (`core-api` ile aynı `JWT_SECRET`, `id` claim)
- **Mesaj türleri (sunucu → istemci)**
  - `room_state` — oyuncu listesi, host, `requiredCount`, `started`
  - `game_started` — host oyunu başlattığında yayın
  - `pong` — `ping` yanıtı
  - `error` — `start_game` reddedildiğinde: `not_host`, `already_started`, `lobby_not_ready`
- **İstemci → sunucu**
  - `ping` / `ready` / `start_game`
- **Yeniden bağlanma** — Aynı `clientId` ile yeni socket açılırsa eski bağlantı kapatılıp kayıt temizlenene kadar beklenir; `joinOrder` tutarlı kalır.
- **Redis (isteğe bağlı)** — `REDIS_ADDR` veya `REDIS_HOST` (+ `:6379`) ile `PING` başarılıysa kanal `riffle:matchmaker` üzerinden çoklu instance fan-out; mesajlarda `origin` (instance UUID) ile döngü engellenir.
- **Docker** — `apps/game-engine/dockerfile` (`dev` / `prod` hedefleri), Compose’da `8080:8080`, `JWT_SECRET`, `WEBSOCKET_ALLOWED_ORIGINS` (`CORS_ORIGIN`), `depends_on: active-game-redis`.

### İstemci (vanilla JS)

- Varsayılan lobi hâlâ **localStorage + `storage` olayı** ile çalışır (MVP).
- Gerçek matchmaker için: URL’de **`?ws=1`** veya `localStorage.setItem("riffle_use_ws_matchmaker", "1")`.
- Özel WebSocket tabanı: `localStorage.riffle_matchmaker_ws` veya `window.__RIFFLE_MATCHMAKER_WS__` (aksi halde `ws(s)://<host>:8080/ws`).
- Kategori akışında host “Start”ta `sendMatchmakerStartGame()` ile sunucuya `start_game` gönderilir (`category-game.js` → `room-sim.js`).

---

## Yapılacaklar / önerilen sıradaki adımlar

### Kısa vadeli

1. **Hata mesajlarının UI’da gösterilmesi** — WebSocket’ten gelen `type: "error"` için kullanıcıya toast / metin (şu an sunucu gönderiyor; istemci genelde yok sayıyor).
2. **Bağlantı durumu** — `onclose` / `onerror` sonrası “Yeniden bağlan” veya kısa geri sayım ile otomatik reconnect (oda kodu korunarak).
3. **Çeviri (i18n)** — Hata metinleri TR/EN `i18n` sözlüğüne taşınabilir.

### Orta vadeli

4. **Gerçek çok oyunculu oyun senkronu** — Lobi matchmaker’da; soru/süre/skor için ya aynı WS kanalı genişletilir ya da oyun motoru için ayrı protokol / servis tanımlanır.
5. **Redis sertifikası / ACL** — Prod’da Redis şifreli erişim veya ACL ile `go-redis` kimlik doğrulaması.
6. **Gözlemlenebilirlik** — Prometheus metrikleri (bağlantı sayısı, oda sayısı, Redis publish hataları), yapılandırılmış loglar.

### Uzun vadeli

7. **Kalıcı oda durumu** — Tam otorite için Redis (veya başka store) + TTL; şu an bellek + isteğe bağlı fan-out.
8. **Yük dengeleme** — Sticky session veya tam Redis-otoriteli durum modeli; birden fazla matchmaker replikası için net strateji dokümante edilmeli.

---

## İlgili dosyalar

| Alan | Konum |
|------|--------|
| Go giriş noktası | `apps/game-engine/cmd/matchmaker/main.go` |
| Hub / WS / Redis | `apps/game-engine/internal/hub/hub.go` |
| JWT | `apps/game-engine/internal/auth/jwt.go` |
| Docker | `apps/game-engine/dockerfile` |
| Compose (servis) | `ops/compose/common/services.yml` (`matchmaker`) |

---

*Son güncelleme: matchmaker reconnect + `start_game` hataları + Redis fan-out ve bu dokümanın eklenmesiyle uyumlu.*
