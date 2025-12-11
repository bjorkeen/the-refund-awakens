# Express + React Auth Boilerplate (for playtime apps)

## Folder Overview

```
express-react-secured-boilerplate/
├── backend/
│   ├── controllers/        # Auth logic abstraction
│   ├── middleware/         # JWT middleware, guards
│   ├── models/             # MongoDB (Mongoose models)
│   ├── services/           # Separate memory-db logic
│   ├── routes/
│   │   ├── auth.js         # auth routes
│   ├── index.js            # Unified entry (Mongo or in-memory)
│   └── ...
└── frontend/
    ├── src/
    │   ├── assets/
    │   ├── components/     # UI and utility components (e.g. AccessGate)
    │   ├── context/        # React Context (AccessProvider)
    │   ├── pages/
    │   └── services/       # Axios and API helpers
```

---

## Setup

### 1. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

---

### 2. Create a `.env` in `/backend`

```env
PORT=5050
JWT_SECRET=your_secret_key
USE_MONGO=false
MONGO_URI=mongodb://localhost:27017/secure-auth
NODE_ENV=development
```

Set `USE_MONGO=true` to enable MongoDB.

---

### 3. Run the servers

#### Option A: In-memory mode

```bash
# Uses in-memory array for user storage
cd backend
node index.js
```

#### Option B: MongoDB mode

```bash
# Requires Mongo running locally or remotely
USE_MONGO=true node index.js
```

> Alternatively, set `USE_MONGO=true` in your `.env`.

---

### 4. Run the frontend

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Frontend Access Control Architecture

* **AccessProvider** (React Context) manages global auth/access state (`hasAccess`, `loading`, etc.) and refreshes access status on app load.
* **AccessGate** (Component) wraps parts of the app to **show a loading indicator** while access status is being verified, preventing UI flickers or unauthorized content flashes.
* **PrivateRoute** component guards protected pages by checking `hasAccess` and redirects unauthorized users.
* All components consume `useAccess()` hook to read and update access state.

---

## API Routes Overview

### `/api/auth` (Authentication)

| Method | Route     | Description              |
| ------ | --------- | ------------------------ |
| POST   | /register | Register new user        |
| POST   | /login    | Login user (sets cookie) |
| POST   | /logout   | Clear auth cookie        |

### `/api/protected` (Guarded)

| Method | Route      | Description                 |
| ------ | ---------- | --------------------------- |
| GET    | /hasAccess | Checks if user is logged in |

> Cookies are set as `HttpOnly`, `SameSite=Strict`, and sent with all requests (`withCredentials: true`).

---

## Test Flow

1. ✅ Register → creates user
2. ✅ Login → sets secure cookie
3. ✅ Access protected route → verifies JWT & access
4. ✅ Logout → clears session cookie

---

## Tech Stack

* **Frontend**: React + Vite + TailwindCSS
* **Backend**: Express.js + JWT Authentication
* **Database**: Optional MongoDB with Mongoose
* **Security**: Helmet, Rate Limiting, CORS configured
* **Storage**: JWT tokens stored in HttpOnly cookies
* **Communication**: Axios with credentials support

---

## TODO / Suggestions

* Add input validation (frontend + backend)
* Add role-based access control
* Improve UI/UX with loading spinners and error states
* Refactor routes and modularize APIs further

---

## Notes

If you see **CORS or 403 errors**, verify ports and proxy settings:

```js
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': 'http://localhost:5050',
    },
  },
};
```

Make sure your backend and frontend ports align with `.env` and config files.

---

## License

MIT — free to use, remix, and build on.

...
# Project Setup

Εδω ειναι ο κωδικας για το landing page. 
Το εκανα docker για να τρεχει ευκολα στον server.

Πως το τρεχουμε:

1. Κατεβασμα:
`git clone <https://github.com/bjorkeen/express-react-template/tree/landingPage> .`

2. Εκκινηση (θελει --build για να φτιαξει τα images):
`docker compose up -d --build`


Φακελοι:
- frontend: Ολα τα αρχεια του React
- backend: Ο server (Node) - χωρις βαση για την ωρα
- docker-compose.yml: Το script που τα σηκωνει ολα