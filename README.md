# 🍅 TOMATO - Food Delivery System

A modern, full-stack food delivery platform built with React, Node.js, Express, and MongoDB.

## 🌟 Features

### Customer Features
- **Restaurant Discovery**: Browse restaurants with ratings and cuisine types
- **Smart Search**: Search for restaurants or specific dishes
- **Dish Search**: Type dish names to find restaurants serving them
- **Cart Management**: Add items to cart, modify quantities
- **Order Placement**: Secure checkout with multiple payment options
- **Order Tracking**: Real-time order status updates
- **Profile Management**: Update personal info, profile photo with Member Status and Wallet
- **Rating System**: Rate completed orders and leave reviews
- **Best Restaurants**: View top-rated restaurants with crown rankings

### Restaurant Owner Features
- **Menu Management**: Add, edit, and manage food items
- **Order Management**: View and update order statuses
- **Analytics**: Track revenue and customer ratings
- **Profile Management**: Update restaurant information

### Admin Features
- **User Management**: Manage customers, owners, and admins
- **Restaurant Approval**: Review and approve restaurant registrations
- **System Analytics**: Monitor platform performance
- **Content Management**: Manage categories and promotions

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **Lucide React** for icons
- **Vite** for build tooling

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Multer** for file uploads
- **bcrypt** for password hashing

### Database
- **MongoDB** for data storage
- **Mongoose** for schema modeling

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 6thsemPROJECT
   ```

### Quick Start (Recommended)

1. **Start the Project**
   Simply run the `servers` shortcut (or `startserver.bat`) from the root folder:
   ```bash
   .\servers
   # OR
   .\startserver.bat
   ```

   This automates everything:
   - Starts MongoDB
   - Starts Backend (Port 5000)
   - Starts Frontend (Port 5173)

2. **Access on PC**
   - Open your browser to: `http://localhost:5173`

3. **Access on Mobile (Wi-Fi/Hotspot)**
   - Ensure your phone is connected to the **SAME Wi-Fi network** or to this laptop's **Hotspot**.
   - The terminal window will display a list of "Mobile/Network Access Links".
   - Look for the link starting with `http://192.168...` (or similar).
   - Type that exact URL into your phone's browser.

   > **Note**: If the site does not load on your phone:
   > 1. Run the **`setup_firewall.ps1`** script once as Administrator. (Right-click -> Run with PowerShell).
   >    *This safely allows connections only to this app, without turning off security.*
   > 2. Ensure "Private Network" is selected for your Wi-Fi connection.

### Manual Setup (Alternative)

If the automatic script doesn't work, you can start services individually:

1. **Start MongoDB**:
   ```bash
   ./mongodb/mongodb-win32-x86_64-windows-7.0.4/bin/mongod.exe --dbpath ./mongodb/data --logpath ./mongodb/logs/mongod.log
   ```

2. **Start Backend**:
   ```bash
   cd backend && npm run dev
   ```

3. **Start Frontend** (with network exposure):
   ```bash
   cd frontend && npm run dev -- --host 0.0.0.0 --port 5173
   ```

## 📁 Project Structure

```
6thsemPROJECT/
├── backend/                 # Backend application
│   ├── src/
│   │   ├── config/         # Database and multer config
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Authentication middleware
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   └── server.ts       # Main server file
│   ├── public/             # Static files
│   └── package.json
├── frontend/                # Frontend application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React contexts
│   │   ├── pages/          # Page components
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   └── App.tsx         # Main app component
│   ├── public/             # Static assets
│   └── package.json
├── mongodb/                 # MongoDB installation
└── startserver.bat         # Startup script
```

## 🔐 Authentication

The system supports three user roles:
- **Customer**: Can browse restaurants, place orders, and manage profile
- **Owner**: Can manage their restaurant and orders
- **Admin**: Has full system access

## 📱 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Customer Endpoints
- `GET /api/customer/restaurants` - Get all restaurants
- `GET /api/customer/best-restaurants` - Get top-rated restaurants
- `POST /api/customer/orders` - Place new order
- `GET /api/customer/orders` - Get user's orders
- `PUT /api/customer/profile` - Update profile

### Owner Endpoints
- `POST /api/owner/restaurant` - Register restaurant
- `PUT /api/owner/menu` - Update menu items
- `GET /api/owner/orders` - Get restaurant orders

### Admin Endpoints
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/restaurant/:id/approve` - Approve restaurant
- `DELETE /api/admin/user/:id` - Delete user

## 🎨 UI Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode Support**: Modern UI with gradients
- **Interactive Animations**: Smooth transitions and hover effects
- **Real-time Updates**: Live order status and cart updates
- **Image Uploads**: Profile photos and food images
- **Search & Filter**: Advanced search with sorting options

## 🔧 Configuration

### Environment Variables
Create `.env` file in backend directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tomato
JWT_SECRET=your-secret-key
NODE_ENV=development
```

## 🚀 Deployment

### Backend Deployment
1. Build the application: `npm run build`
2. Set production environment variables
3. Use PM2 or similar for process management

### Frontend Deployment
1. Build for production: `npm run build`
2. Serve static files using nginx/apache
3. Configure reverse proxy for API calls

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Create pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support or questions, please contact the development team.

---

**Built with ❤️ for delicious food delivery experiences**
