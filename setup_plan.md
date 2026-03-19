# Final Step: Frontend Deployment (Vercel)

Now that your backend is live on Render, follow these steps to launch the website.

### 1. Vercel Configuration
1. Go to [vercel.com](https://vercel.com) and click **"Add New"** -> **"Project"**.
2. Import your GitHub repository.
3. Click **"Edit"** next to **Root Directory** and select:
   `Tomato-food-delivering-website/frontend`
4. Expand the **Environment Variables** section and add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-tomato-backend.onrender.com/api` 
   *(⚠️ Replace this with your actual Render URL and keep the `/api` at the end!)*

### 2. Deploy
1. Click **"Deploy"**.
2. Once it's finished, you'll get a URL like `https://tomato-frontend.vercel.app`. **Copy this URL.**

### 3. Final Step: Link Back to Render
To allow your frontend to talk to the backend securely (CORS):
1. Go back to your **Render Dashboard**.
2. Go to the **Environment** tab of your backend service.
3. Find `FRONTEND_URL` and change its value to your new Vercel URL (e.g., `https://tomato-frontend.vercel.app`).
4. Save changes.

**Congratulations! Your full-stack app is now live! 🍅🚀✨**

---

## 🏁 Final Verification Status: COMPLETE ✅
The project has been rigorously cleaned and optimized:
- **Zero Compilation Warnings**: All unused imports and variables removed.
- **Production CSS**: High-performance shadows shifted to standard CSS.
- **Render Ready**: Port handling and folder structure standardized.

### Final Health Check
1. Visit `https://your-backend.onrender.com/health` to confirm the backend is live.
2. Check the browser console on your Vercel URL to confirm it's 100% warning-free.

