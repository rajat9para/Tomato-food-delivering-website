# Food Delivery App

A real-time food delivery tracking system built with React/Next.js frontend and Node.js/Express backend with MongoDB.

## Features

- **Rider Profile Management**: Display rider information with availability toggle
- **Real-time Map Integration**: Live map using Leaflet.js and OpenStreetMap
- **Distance Calculation**: OpenRouteService API for real-time distance and ETA
- **Location Tracking**: Simulated rider movement with database updates
- **Responsive Design**: Modern UI with TailwindCSS

## Tech Stack

### Frontend
- Next.js 13
- React 18
- TypeScript
- TailwindCSS
- Leaflet.js
- React-Leaflet
- Axios

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- OpenRouteService API

## Project Structure

```
food-delivery-app/
├── backend/
│   ├── models/
│   │   └── Rider.js          # MongoDB schema
│   ├── routes/
│   │   └── riderRoutes.js    # API endpoints
│   ├── server.js             # Express server
│   ├── package.json
│   └── .env                  # Environment variables
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── RiderProfile.tsx  # Rider profile component
│   │   └── DeliveryMap.tsx   # Map component
│   ├── lib/
│   │   └── axios.ts          # API client
│   ├── package.json
│   ├── tailwind.config.js
│   └── next.config.js
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (running locally or connection string)
- OpenRouteService API key (free from https://openrouteservice.org/)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/food-delivery
OPENROUTESERVICE_API_KEY=your_api_key_here
```

4. Start the backend server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file (optional):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. Start the frontend development server:
```bash
npm run dev
```

## API Endpoints

### Riders
- `GET /api/riders` - Get all riders
- `GET /api/riders/:id` - Get specific rider
- `POST /api/riders` - Create new rider
- `PATCH /api/riders/:id/status` - Update rider availability
- `PATCH /api/riders/:id/location` - Update rider location
- `GET /api/riders/:id/distance?customerLat=X&customerLng=Y` - Calculate distance and ETA

## Features Implementation

### Rider Profile
- Displays rider information (name, phone, vehicle type, status, location)
- Toggle availability status (available/busy)
- Real-time status updates

### Real-time Map
- Interactive map using OpenStreetMap tiles (free)
- Rider and customer markers with popups
- Distance and ETA overlay
- Simulated rider movement every 5 seconds

### Distance Calculation
- OpenRouteService API integration
- Real-time distance calculation between rider and customer
- ETA estimation based on current traffic conditions

## Usage

1. Start both backend and frontend servers
2. The app will create a demo rider automatically
3. Use the availability toggle to change rider status
4. Watch the rider move towards the customer on the map
5. Distance and ETA update in real-time

## Environment Variables

### Backend (.env)
- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `OPENROUTESERVICE_API_KEY`: Your OpenRouteService API key

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:5000/api)

## Notes

- The rider location is simulated and moves towards the customer every 5 seconds
- OpenRouteService API has a free tier with rate limits
- Map tiles are provided by OpenStreetMap (completely free)
- The app uses a demo rider ID for simplicity

## Future Enhancements

- Real rider authentication
- Multiple rider support
- Order management system
- WebSocket integration for real-time updates
- Customer interface
- Payment integration
