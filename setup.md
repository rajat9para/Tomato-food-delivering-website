# TOMATO Food Delivery - Complete Deployment Guide

## Project Overview
This is a full-stack food delivery application with:
- **Frontend**: React + Vite (deployed on Vercel)
- **Backend**: Node.js + Express (deployed on Render)
- **Database**: MongoDB Atlas
- **File Storage**: Local uploads directory

## Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account
- Vercel account
- Render account
- Git installed (required for deployment)

## Important Notes
- **GitHub is required** for deployment to both Vercel and Render
- You need to push your code to a GitHub repository first
- Both Vercel and Render integrate with GitHub for automatic deployments
- If you don't have a GitHub repository yet, create one and push your code

## 1. Backend Deployment (Render)

### 1.1 Prepare Backend Code
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Build TypeScript (if needed)
npx tsc
```

### 1.2 Environment Variables for Render
Create `.env` file in backend directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=https://your-frontend-url.vercel.app
```

### 1.3 Deploy to Render
1. **Create New Web Service on Render:**
   - Git Repository: Connect your GitHub repository (required)
   - Make sure your code is pushed to GitHub first
   - Render will automatically deploy when you push changes
   - Environment: Node
   - Build Command: `npm install && npm run build` (if you have build script)
   - Start Command: `npm start`
   - Port: **5000** (CRITICAL - must match PORT env var)

2. **Set Environment Variables in Render Dashboard:**
   - Go to your service → Settings → Environment Variables
   - Add all variables from your `.env` file

3. **Deploy:**
   - Click "Deploy" and wait for completion
   - Check deployment logs for any errors

### 1.4 Verify Backend Deployment
```bash
# Test health endpoint
curl https://your-backend-url.onrender.com/api/health
```

## 2. Frontend Deployment (Vercel)

### 2.1 Prepare Frontend Code
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

### 2.2 Environment Variables for Vercel
Create `.env.local` file in frontend directory:
```env
VITE_API_URL=https://your-backend-url.onrender.com/api
```

### 2.3 Deploy to Vercel
1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel --prod
```

3. **Alternative: GitHub Integration:**
   - Push your code to GitHub
   - Connect your GitHub repository in Vercel dashboard
   - Vercel will automatically deploy on each push

3. **Set Environment Variables in Vercel Dashboard:**
   - Go to your project → Settings → Environment Variables
   - Add: `VITE_API_URL` with your backend URL

### 2.4 Verify Frontend Deployment
- Visit your Vercel URL
- Test login functionality
- Check browser console for any API errors

## 3. Database Setup (MongoDB Atlas)

### 3.1 Create MongoDB Atlas Cluster
1. Sign up for MongoDB Atlas
2. Create new cluster (FREE tier is fine)
3. Create database user
4. Get connection string

### 3.2 Set MongoDB URI
Use this format:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/database-name?retryWrites=true&w=majority
```

## 4. Environment Variables Summary

### Backend Environment Variables:
| Variable | Required | Description |
|----------|----------|-------------|
| PORT | ✅ | Port for backend server (5000) |
| MONGODB_URI | ✅ | MongoDB connection string |
| JWT_SECRET | ✅ | Secret for JWT tokens |
| FRONTEND_URL | ✅ | URL of deployed frontend |

### Frontend Environment Variables:
| Variable | Required | Description |
|----------|----------|-------------|
| VITE_API_URL | ✅ | URL of deployed backend API |

## 5. API Endpoints

### Backend Base URL: `https://your-backend-url.onrender.com/api`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/auth/verify` | GET | Token verification |
| `/api/public/restaurants` | GET | Public restaurant search |
| `/api/public/dishes` | GET | Public dish search |
| `/api/health` | GET | Health check |

## 6. Troubleshooting

### Common Issues:

1. **API Calls Failing:**
   - Check if PORT is set to 5000 on Render
   - Verify VITE_API_URL points to correct backend URL
   - Check CORS configuration

2. **Deployment Fails:**
   - Check build logs in Render/Vercel
   - Ensure all dependencies are in package.json
   - Verify environment variables are set

3. **Database Connection Issues:**
   - Check MongoDB URI format
   - Verify database user permissions
   - Check network access in MongoDB Atlas

### Debug Commands:
```bash
# Check backend health
curl https://your-backend-url.onrender.com/api/health

# Check frontend API calls in browser console
# Look for network tab errors
```

## 7. Development vs Production

### Development:
- Frontend: `http://localhost:5175`
- Backend: `http://localhost:5000`
- API Proxy: Vite proxy configuration

### Production:
- Frontend: Deployed on Vercel (via GitHub)
- Backend: Deployed on Render (via GitHub)
- Direct API calls to production URLs

## 8. Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files to Git
   - Use `.gitignore` to exclude them

2. **JWT Secret:**
   - Use strong, unique secret
   - Rotate periodically

3. **CORS:**
   - Only allow trusted domains
   - Use specific origins, not wildcards

4. **Dependencies:**
   - Run `npm audit` regularly to check for vulnerabilities
   - Update dependencies when security patches are available
   - Consider using `npm audit fix` to automatically fix vulnerabilities
   - For critical vulnerabilities, manual updates may be required

## 9. File Uploads

- Uploads are stored in `public/uploads` directory
- Ensure directory exists and has proper permissions
- Consider cloud storage for production (AWS S3, Cloudinary)

## 10. Testing

### After Deployment:
1. Test user registration
2. Test user login
3. Test API endpoints
4. Test file uploads
5. Test error handling

### GitHub Workflow:
1. Push your code to GitHub repository
2. Verify automatic deployment on Vercel and Render
3. Check deployment logs for any issues

### Automated Testing:
- Consider adding unit tests
- Add integration tests for API endpoints
- Add E2E tests for critical user flows

---

**Note:** Replace `your-backend-url` and `your-frontend-url` with your actual deployed URLs.