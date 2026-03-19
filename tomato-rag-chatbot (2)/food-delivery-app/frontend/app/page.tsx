import RiderDashboard from '../components/RiderDashboard';
import MultiRiderMap from '../components/MultiRiderMap';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-red-600">🍕 Food Delivery</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Multi-Rider Real-time Tracking</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600">Live</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rider Dashboard */}
          <div className="lg:col-span-1">
            <RiderDashboard />
          </div>
          
          {/* Multi-Rider Map */}
          <div className="lg:col-span-2">
            <MultiRiderMap />
          </div>
        </div>
        
        {/* System Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Active Riders</h3>
                <p className="text-sm text-gray-500">5 riders online</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">📦</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Active Orders</h3>
                <p className="text-sm text-gray-500">12 orders in progress</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-bold">⚡</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Avg Delivery Time</h3>
                <p className="text-sm text-gray-500">22 minutes</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">📍</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Real-time Updates</h3>
                <p className="text-sm text-gray-500">WebSocket connected</p>
              </div>
            </div>
          </div>
        </div>

        {/* MongoDB Storage Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">🗄️ MongoDB Storage Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-700 mb-2">Where Riders Are Stored:</h4>
              <ul className="space-y-1 text-blue-600">
                <li>• Database: <code className="bg-blue-100 px-1 rounded">food-delivery</code></li>
                <li>• Collection: <code className="bg-blue-100 px-1 rounded">riders</code></li>
                <li>• Each rider has unique <code className="bg-blue-100 px-1 rounded">_id</code></li>
                <li>• Real-time location updates stored in <code className="bg-blue-100 px-1 rounded">current_location</code></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-700 mb-2">Real-time Features:</h4>
              <ul className="space-y-1 text-blue-600">
                <li>• WebSocket connection for live updates</li>
                <li>• Automatic location simulation every 3 seconds</li>
                <li>• Multi-rider tracking on single map</li>
                <li>• Instant status updates across all clients</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
