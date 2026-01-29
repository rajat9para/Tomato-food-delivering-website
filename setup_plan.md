# Setup Plan: Professional Deployment

This document outlines the steps to host the TOMATO platform on Vercel (Frontend) and Render (Backend).

## 1. Backend Deployment (Render)
Render is ideal for Node.js backends.

**Steps:**
1. Create a MongoDB Atlas cluster and get your connection string.
2. Link your GitHub repository to Render.
3. **Render Dashboard Settings:**
   - **Root Directory**: `backend` (or `Tomato-food-delivering-website/backend` depending on your repo structure)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start` (I updated this to have a fallback!)
5. **Environment Variables** in Render Dashboard:
   - `MONGODB_URI`: `mongodb+srv://rajat9parasf_db_user:c9y7bX6CSXbT27hx@cluster0.omccwhv.mongodb.net/tomato?retryWrites=true&w=majority&appName=Cluster0`
   - `JWT_SECRET`: `your_secure_random_string`
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: `https://your-tomato-app.vercel.app`

## 2. Frontend Deployment (Vercel)
Vercel is optimized for Vite/React applications.

**Steps:**
1. Link your GitHub repository to Vercel.
2. Select the `frontend` folder as the root directory.
3. **Environment Variables** in Vercel Dashboard:
   - `VITE_API_URL`: `https://your-tomato-backend.onrender.com/api`
4. **Build settings:**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

## 3. Mandatory Check
- Ensure `backend/index.ts` uses `process.env.FRONTEND_URL` for CORS.
- Ensure `frontend/src/utils/api.ts` uses `import.meta.env.VITE_API_URL`.
