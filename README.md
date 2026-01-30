# 🍅 Tomato - Premium Food Delivery Platform

A fully functional, full-stack food delivery application built with the MERN stack (MongoDB, Express, React, Node.js). This project features a premium UI/UX, robust role-based authentication (Customer, Restaurant Owner, Admin), and a complete order management flow.

## 🚀 Live Deployment
- **Frontend (Vercel)**: [https://tomato-food-delivering-website.vercel.app](https://tomato-food-delivering-website.vercel.app)
- **Backend (Render)**: [https://tomato-food-delivering-website-by-devx.onrender.com/api](https://tomato-food-delivering-website-by-devx.onrender.com/api)

---

## ✨ Features
- **Modern UI**: Glassmorphism, Animated Preloader, and "Lato" typography.
- **Roles**:
    - **Admin**: Approve restaurants, view systemic analytics.
    - **Owner**: Manage restaurant, menu, and orders.
    - **Customer**: Browse, Search, Cart, Order, and Profile management.
- **Security**: JWT Authentication, HttpOnly cookies (local), secure headers.
- **Tech Stack**:
    - **Frontend**: React, Vite, Tailwind CSS, Framer Motion, GSAP, Axios.
    - **Backend**: Node.js, Express, MongoDB, Mongoose, JWT, Image Upload (Multer).

---

## 🛠️ Setup & Running Locally

### 1. Prerequisites
- Node.js (v16+)
- MongoDB (Running locally or Atlas URI)

### 2. Environment Variables
Create `.env` in `backend/` and `frontend/` directories.

**Backend (`backend/.env`):**
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
# For checking CORS on production
FRONTEND_URL=https://tomato-food-delivering-website.vercel.app
```

**Frontend (`frontend/.env`):**
```env
# Point to local for dev, or Render for production
VITE_API_URL=http://localhost:5000/api
```

### 3. Installation
```bash
# Install Backend
cd backend
npm install

# Install Frontend
cd ../frontend
npm install
```

### 4. Running the App
**Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

---

## 🔐 Credentials

### Default Admin Account
- **Email**: `admin@tomato.com`
- **Password**: `admin123`
*(Use this to log in to the Admin Dashboard)*

---

## 📂 Project Structure
- `frontend/`: React application (Vite-based).
- `backend/`: Node.js/Express API.
- `backend/uploads/`: Local storage for uploaded images.

---

## ⚠️ Admin & Owner Notes
- New Restaurants must be **approved** by the Admin before they appear in the app.
- Owners can only manage their own restaurant.
- Ensure `FRONTEND_URL` and `VITE_API_URL` are set correctly on deployment platforms (Vercel/Render) for CORS to work.

---
*Built with ❤️ for the 6th Sem Project.*
