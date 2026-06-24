# WhoIsMafia

> *Kim mafia ekanini top — agar ulgurasang.*

Real-time onlayn **Mafia o'yini** platformasi. 3 dan 50 tagacha o'yinchi, AI moderator, Telegram autentifikatsiya va ko'p tilli interfeys bilan.

---

## Texnologiyalar

| Layer | Texnologiya |
|---|---|
| Backend | Laravel 13 (PHP 8.2+) |
| Real-time | Laravel Reverb (WebSocket) |
| Frontend | React 18 + Vite |
| Auth | Telegram Login Widget |
| Database | PostgreSQL |
| AI Moderator | Groq API |
| Styling | Tailwind CSS |

---

## Xususiyatlar

- **Rollar tizimi** — Mafia, Sheriff, Doktor, Fuqaro + qo'shimcha rollar
- **AI Moderator** — har bir round uchun jonli hikoya va o'yin boshqaruvi
- **Ikki xil chat** — umumiy chat va mafia yashirin chat
- **Link orqali kirish** — Google Meet uslubida xona yaratish
- **Rejalashtirilgan o'yin** — oldindan vaqt belgilash va Telegram notification
- **Statistika** — o'yinlar tarixi, g'alaba foizi, rol statistikasi
- **Ko'p til** — O'zbek, Rus, Ingliz
- **Dark / Light tema**

---

## O'yin haqida

WhoIsMafia — klassik Mafia o'yinining onlayn versiyasi.

**Ikkita jamoa:**
- **Mafia** — kechasi fuqarolarni o'ldiradi, kunduz o'zini yashiradi
- **Fuqarolar** — mafiani topib, ovoz bilan chiqarib yuboradi

**Maxsus rollar:**

| Rol | Jamoa | Kuchi |
|---|---|---|
| Mafia | Mafia | Kechasi odam o'ldiradi |
| Sheriff | Fuqaro | Kechasi birini tekshiradi |
| Doktor | Fuqaro | Kechasi birini qutqaradi |
| Fuqaro | Fuqaro | Maxsus kuchi yo'q |

**O'yin bosqichlari:**
```
Tun → Mafia harakat → Sheriff tekshiradi → Doktor qutqaradi
  ↓
Kun → AI hikoyasi → Muhokama → Ovoz berish → Chiqarish
  ↓
Natija tekshiruvi → (agar o'yin davom etsa) → Tun...
```

---

## O'rnatish

### Talablar

- PHP >= 8.2
- Composer
- Node.js >= 20
- PostgreSQL >= 15

### 1. Loyihani clone qilish

```bash
git clone https://github.com/sobirjon-swe/whoismafia.git
cd whoismafia
```

### 2. Backend sozlash

```bash
cd web/whoismafia
composer install
cp .env.example .env
php artisan key:generate
```

### 3. `.env` faylini to'ldirish

```env
APP_NAME=WhoIsMafia
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=whoismafia
DB_USERNAME=postgres
DB_PASSWORD=

TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username

GROQ_API_KEY=your_groq_api_key

REVERB_APP_ID=whoismafia
REVERB_APP_KEY=your_reverb_key
REVERB_APP_SECRET=your_reverb_secret
REVERB_HOST=localhost
REVERB_PORT=8080
```

### 4. Database

```bash
php artisan migrate
php artisan db:seed
```

### 5. Frontend

```bash
npm install
npm run dev
```

### 6. Serverlarni ishga tushirish

```bash
# Terminal 1 — Laravel
php artisan serve

# Terminal 2 — WebSocket
php artisan reverb:start

# Terminal 3 — Queue
php artisan queue:work
```

---

## Loyiha tuzilmasi

```
whoismafia/
├── web/whoismafia/          # Laravel backend + React frontend
│   ├── app/
│   │   ├── Events/          # WebSocket events
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   └── Services/
│   │       ├── GameService.php
│   │       ├── RoleService.php
│   │       ├── AiModeratorService.php
│   │       └── TelegramService.php
│   ├── database/migrations/
│   ├── resources/js/        # React frontend
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Lobby.jsx
│   │   │   ├── Game.jsx
│   │   │   └── Results.jsx
│   │   └── components/
│   └── routes/
│       ├── api.php
│       └── channels.php
└── design/                  # Dizayn reference fayllari
```

---

## API Endpointlar

```
POST   /api/auth/telegram          # Telegram login
POST   /api/auth/guest             # Mehmon kirish
DELETE /api/auth/logout            # Chiqish

POST   /api/rooms                  # Xona yaratish
GET    /api/rooms/{code}           # Xona ma'lumoti
POST   /api/rooms/{code}/join      # Xonaga qo'shilish
POST   /api/rooms/{code}/ready     # Tayyor belgisi
POST   /api/rooms/{code}/start     # O'yinni boshlash

POST   /api/game/{code}/vote       # Ovoz berish
POST   /api/game/{code}/action     # Tun harakati
GET    /api/game/{code}/state      # O'yin holati

GET    /api/stats                  # Foydalanuvchi statistikasi
GET    /api/history                # O'yin tarixi
```

---

## Rol Balans

| O'yinchilar | Mafia | Sheriff | Doktor | Fuqaro |
|---|---|---|---|---|
| 3–4 | 1 | 0 | 0 | 2–3 |
| 5–6 | 1 | 1 | 0 | 3–4 |
| 7–9 | 2 | 1 | 1 | 3–5 |
| 10–15 | 3 | 1 | 1 | 5–10 |
| 16–25 | 4–5 | 2 | 1 | qolganlar |
| 26–50 | 6–8 | 2–3 | 1–2 | qolganlar |

> Mafia soni hech qachon umumiy o'yinchilarning 25% dan oshmasin.

---

## Litsenziya

MIT License © 2025 WhoIsMafia
