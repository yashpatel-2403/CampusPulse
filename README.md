# 🎓 Campus Pulse — Smart Complaint Management System

A full-stack MERN web application for LD College of Engineering, Ahmedabad.  
Students submit campus complaints with photos and GPS pins. Admins manage, track, and resolve them with real-time notifications, analytics, and a Snapchat-style heatmap.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (free tier works)
- Cloudinary account (free tier works)

### 1. Clone & setup backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your real credentials (see .env.example for instructions)
npm run seed    # creates 1 admin + 10 students + 50 sample complaints
npm run dev     # starts on http://localhost:5000
```

### 2. Setup frontend

```bash
cd frontend
npm install
# For local dev, no .env needed — Vite proxies /api to localhost:5000
npm run dev     # starts on http://localhost:5173
```

### 3. Demo credentials (after seeding)

| Role    | Email                     | Password      |
|---------|---------------------------|---------------|
| Admin   | admin@campus.edu          | password123   |
| Student | student1@campus.edu       | password123   |

> ⚠️ **Change these credentials before any public deployment!**

---

## 🌐 Production Deployment

### Backend → Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Set **Root Directory**: `backend`
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `npm start`
6. Add all environment variables from `.env.example` in the Render dashboard
7. Set `NODE_ENV=production` and `CLIENT_URL=https://your-vercel-app.vercel.app`

### Frontend → Vercel

1. Import your repo on [vercel.com](https://vercel.com)
2. Set **Root Directory**: `frontend`
3. Add environment variable: `VITE_API_URL=https://your-render-backend.onrender.com`
4. Deploy — the `vercel.json` SPA rewrite is already configured

### Database → MongoDB Atlas

1. Create a free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user
3. Whitelist `0.0.0.0/0` (or Render's IP) under Network Access
4. Copy the connection string into `MONGO_URI` in your Render environment variables

### Images → Cloudinary

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Copy Cloud Name, API Key, API Secret to your Render environment variables

---

## 🏗️ Project Structure

```
campus-pulse/
├── backend/
│   └── src/
│       ├── config/          # DB, Cloudinary, env validation
│       ├── controllers/     # Route handlers (auth, complaint, admin, config)
│       ├── middleware/      # JWT protect, adminOnly, ObjectId validator
│       ├── models/          # User, Complaint, Notification, CampusConfig
│       ├── routes/          # Express routers
│       ├── sockets/         # Socket.io setup with rooms
│       └── utils/           # seed, validation helpers, http helpers
└── frontend/
    └── src/
        ├── components/      # Reusable UI, CampusMapPicker, NotificationBell
        ├── constants/       # LDCE boundary, building list
        ├── context/         # Auth + Socket contexts
        ├── layouts/         # Student + Admin layouts
        ├── pages/           # All page components
        └── services/        # Axios API client, boundary service
```

---

## ⚙️ Tech Stack

| Layer       | Technology                                  |
|-------------|---------------------------------------------|
| Frontend    | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend     | Node.js, Express.js                         |
| Database    | MongoDB Atlas, Mongoose                     |
| Auth        | JWT, bcrypt                                 |
| Real-time   | Socket.io (WebSocket + polling fallback)    |
| Maps        | Leaflet, React-Leaflet                      |
| Charts      | Recharts                                    |
| Images      | Cloudinary (memory → stream upload)         |
| Security    | Helmet, compression, rate limiting, CORS    |
| Deployment  | Vercel (FE) + Render (BE) + MongoDB Atlas   |

---

## 🔑 Environment Variables Reference

### Backend (`backend/.env`)

| Variable                  | Description                                      |
|---------------------------|--------------------------------------------------|
| `PORT`                    | Server port (default: 5000)                      |
| `NODE_ENV`                | `development` or `production`                    |
| `MONGO_URI`               | MongoDB Atlas connection string                  |
| `JWT_SECRET`              | Long random string for signing tokens            |
| `JWT_EXPIRE`              | Token expiry e.g. `7d`                           |
| `CLOUDINARY_CLOUD_NAME`   | Cloudinary dashboard → Cloud Name                |
| `CLOUDINARY_API_KEY`      | Cloudinary dashboard → API Key                   |
| `CLOUDINARY_API_SECRET`   | Cloudinary dashboard → API Secret                |
| `CLIENT_URL`              | Comma-separated allowed frontend origins         |

### Frontend (`frontend/.env`)

| Variable        | Description                             |
|-----------------|-----------------------------------------|
| `VITE_API_URL`  | Backend URL (e.g. https://api.render.com) — leave empty for local dev |

---

## 🔒 Security Features

- JWT authentication with 7-day expiry
- bcrypt password hashing (12 rounds)
- Rate limiting on `/api/auth` (30 requests / 15 min)
- Helmet.js security headers
- CORS restricted to allowed origins
- Input validation and RegExp escaping
- MongoDB ObjectId validation middleware
- File upload validation (type + 5MB size limit)
- Cloudinary cleanup on complaint deletion/update
- Environment variable validation at startup

---

## 📱 Features

- **Student**: Register, login, submit complaints (3-step wizard with campus map pin + photo), track status, edit/delete pending complaints, real-time notifications
- **Admin**: Dashboard with live stats, manage all complaints (search, filter, sort, paginate), change status/priority, assign complaints, view analytics charts, Snapchat-style heatmap, edit campus boundary polygon
- **Real-time**: Socket.io notifications for new complaints (admin) and status/priority changes (student)
- **Campus Map**: Restricted to LDCE boundary with ray-casting polygon check, nearest building auto-detection, admin-editable boundary stored in MongoDB
