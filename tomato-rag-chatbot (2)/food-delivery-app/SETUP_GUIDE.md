# 🚀 Complete Setup Guide for Food Delivery App

## Step 1: Get OpenRouteService API Key

1. **Visit OpenRouteService**: Go to https://openrouteservice.org/
2. **Sign Up**: Create a free account
3. **Get API Key**: 
   - Go to your dashboard
   - Find "API Keys" section
   - Copy your API key (it starts with "ors-...")
4. **Add to Backend**: Update the `.env` file in the backend folder

## Step 2: Configure Environment

### Backend Configuration
Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/food-delivery
OPENROUTESERVICE_API_KEY=your_actual_api_key_here
```

### Frontend Configuration (Optional)
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Step 3: Start MongoDB

### Option A: Using MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a free cluster
4. Get your connection string
5. Update `MONGODB_URI` in backend/.env

### Option B: Local MongoDB Installation
1. **Download MongoDB**: https://www.mongodb.com/try/download/community
2. **Install**: Follow installation instructions
3. **Start MongoDB Server**:
   ```bash
   # Windows
   mongod
   
   # Or using services
   net start MongoDB
   ```

### Option C: Using Docker
```bash
docker run -d -p 27017:27017 --name mongodb mongo
```

## Step 4: Run the Application

### Method 1: Using Terminal Commands

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Method 2: Using IDE Run Buttons
1. Open terminal in backend folder → Run `npm run dev`
2. Open new terminal in frontend folder → Run `npm run dev`

## Step 5: Access the Application

- **Frontend**: http://localhost:3000 (or 3001 if 3000 is busy)
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## Step 6: Test the Features

1. **Open Browser**: Navigate to the frontend URL
2. **Create Demo Rider**: The app automatically creates a demo rider
3. **Test Rider Profile**:
   - View rider information
   - Click "Set as Busy/Available" to toggle status
4. **Test Map Features**:
   - See rider and customer markers
   - Watch simulated movement (every 5 seconds)
   - View distance and ETA (requires API key)

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Make sure MongoDB is running on port 27017

#### 2. Port Already in Use
```
Error: listen EADDRINUSE :::3000
```
**Solution**: The app will automatically try the next port (3001, 3002, etc.)

#### 3. API Key Error
```
OpenRouteService API key not configured
```
**Solution**: Add your API key to backend/.env file

#### 4. Dependency Issues
```bash
npm audit fix
```
**Solution**: Run this command in both frontend and backend folders

#### 5. TypeScript Errors
**Solution**: Make sure all dependencies are installed:
```bash
npm install --save-dev @types/leaflet @types/node @types/react @types/react-dom
```

### Verification Commands

#### Check Backend Health
```bash
curl http://localhost:5000/api/health
```
Expected response: `{"status":"OK","timestamp":"..."}`

#### Check API Endpoints
```bash
# Get all riders
curl http://localhost:5000/api/riders

# Create test rider
curl -X POST http://localhost:5000/api/riders \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Rider","phone":"+1234567890","vehicle_type":"bike","current_location":{"lat":40.7128,"lng":-74.0060},"status":"available"}'
```

## Development Tips

### Hot Reload
- Both frontend and backend support hot reload
- Changes to code will automatically restart the servers

### Database Reset
To clear all data and start fresh:
```bash
# In MongoDB shell
use food-delivery
db.dropDatabase()
```

### Logs
- Backend logs show in terminal
- Frontend logs show in browser console (F12)

## Production Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/food-delivery
OPENROUTESERVICE_API_KEY=your_production_api_key
```

### Build Frontend
```bash
cd frontend
npm run build
npm start
```

## Support

If you encounter any issues:
1. Check the terminal logs for error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB is running
4. Make sure API keys are valid

## Quick Start Summary

```bash
# 1. Get API key from openrouteservice.org
# 2. Update backend/.env with API key
# 3. Start MongoDB
# 4. Run backend: cd backend && npm run dev
# 5. Run frontend: cd frontend && npm run dev
# 6. Open http://localhost:3000
```
