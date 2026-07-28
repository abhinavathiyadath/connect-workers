# Village Workers Connecting Platform (with Smart Recommendation)

A beginner-friendly **MERN** mini project: customers find approved workers near them, book slots, rate completed jobs, and workers manage profiles and requests. Admins approve workers and view analytics. **Recommendation scores** use a simple weighted formula (distance, price, rating, bookings) with min–max normalization.

## Tech stack

- **MongoDB** + **Mongoose**
- **Express.js** + **Node.js**
- **React** (Vite) + **React Router** + **Axios**
- **JWT** authentication + **bcrypt** password hashing

## Project structure

```
finalproject/
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/auth.js
│   ├── models/
│   ├── routes/
│   ├── utils/recommendation.js
│   └── server.js
├── frontend/
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── services/
│       ├── context/
│       ├── App.js          ← re-exports `App.jsx` (Vite needs `.jsx` for JSX)
│       └── App.jsx
├── .env.example
└── README.md
```

## Prerequisites

- **Node.js** 18+ (recommended)
- **MongoDB** running locally (`mongodb://127.0.0.1:27017`) or a **MongoDB Atlas** connection string

## Step-by-step: run locally

### 1. MongoDB

Start local MongoDB, or create a cluster on Atlas and copy the connection string.

### 2. Backend (port **5000**)

```bash
cd backend
cp .env.example .env
# Edit .env: set MONGODB_URI and JWT_SECRET
npm install
npm start
```

You should see: `MongoDB connected` and `Server running on port 5000`.  
On first run, a default admin is created if missing:

- Email: `admin@worker.com`
- Password: `admin123`

### 3. Frontend (port **3000**)

Open a **new** terminal:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The Vite dev server proxies `/api` to `http://localhost:5000`, so you usually **do not** need a frontend `.env` file.

### 4. Try the flow

1. **Register** as a **worker** → fill **Worker dashboard** profile → log in as **admin** → **Approve** the worker.
2. **Register** as a **customer** → **Location** (lat/lng) → **Find Workers** → book a slot.
3. As **worker**: accept → mark **completed**; as **customer**: submit **rating**.
4. Check **notifications** (bell) and **admin analytics**.

## Environment variables

| Variable        | Description                          |
|----------------|--------------------------------------|
| `MONGODB_URI`  | MongoDB connection string            |
| `JWT_SECRET`   | Secret for signing JWTs              |
| `PORT`         | Backend port (default `5000`)        |
| `CLIENT_ORIGIN`| CORS origin (default `http://localhost:3000`) |

See `backend/.env.example` and the root `.env.example`.

## Recommendation formula (manual “ML” scoring)

For each approved worker relative to the customer’s location:

- **distance_score**: closer → higher (inverse of normalized distance)
- **price_score**: lower price → higher (inverse of normalized price)
- **rating_score**: higher rating → higher
- **booking_score**: more past bookings → higher

Combined:

`score = 0.4×distance + 0.2×price + 0.2×rating + 0.2×booking`

Implementation: `backend/utils/recommendation.js`.

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/workers/recommended?lat=&lng=&skill=&village=`
- `POST /api/workers/profile` (worker), `GET /api/workers/profile/me`
- `POST /api/bookings`, `GET /api/bookings/customer`, `GET /api/bookings/worker`
- `PATCH /api/bookings/:id/accept|reject|complete`, `POST /api/bookings/:id/rate`
- `GET /api/notifications`, `PATCH /api/notifications/read-all`, `PATCH /api/notifications/:id/read`
- `GET /api/admin/analytics`, `GET /api/admin/users`, `GET /api/admin/workers/pending`, etc.

## License

Educational / college project use.
