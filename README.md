# TOMATO Food Delivery Platform

TOMATO is a full-stack MERN food delivery project with customer, restaurant owner, rider, and admin workflows.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, Axios
- Backend: Node.js, Express, TypeScript, MongoDB, Mongoose, JWT, Multer
- Deployment: Vercel for frontend, Render for backend

## Main Features

- Customer restaurant discovery, dish search, cart, orders, ratings, profile photo, wallet, and premium membership
- Restaurant owner menu and order management
- Rider order queue, active delivery workflow, delivery history, and location support
- Admin approvals, analytics, users, restaurants, contacts, and revenue views
- AI chatbot backed by live MongoDB data for dish and restaurant recommendations

## Local Setup

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tomato
JWT_SECRET=change-this-secret
FRONTEND_URL=http://localhost:5175
GROQ_API_KEY=your_groq_key
TOMTOM_API_KEY=your_tomtom_key
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Install and run:

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5175`; backend runs on `http://localhost:5000`.

## Deployment Notes

Backend Render env vars:

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `FRONTEND_URL`
- `GROQ_API_KEY`
- `TOMTOM_API_KEY`

Frontend Vercel env vars:

- `VITE_API_URL=https://your-render-service.onrender.com/api`

After changing environment variables, redeploy both services and verify:

```bash
curl https://your-render-service.onrender.com/api/health
```

## Security Notes

- Do not commit `.env` files or API keys.
- Rotate any API key that has been pasted into chat or committed by mistake.
- Production file uploads are currently stored on the backend filesystem. For long-term production use, move uploads to persistent storage such as S3 or Cloudinary.
