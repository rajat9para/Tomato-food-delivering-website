'use client';

import { useState, useEffect } from 'react';
import api from '../lib/axios';
import { io, Socket } from 'socket.io-client';

interface Rider {
  _id: string;
  name: string;
  phone: string;
  vehicle_type: string;
  current_location: {
    lat: number;
    lng: number;
  };
  status: 'available' | 'busy';
}

export default function RiderDashboard() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join rider tracking room
    newSocket.emit('join-room', 'rider-tracking');

    // Listen for real-time updates
    newSocket.on('rider-location-updated', (updatedRider: Rider) => {
      setRiders(prevRiders => 
        prevRiders.map(rider => 
          rider._id === updatedRider._id ? updatedRider : rider
        )
      );
    });

    newSocket.on('riders-updated', (updatedRiders: Rider[]) => {
      setRiders(updatedRiders);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchRiders();
    createDemoRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      const response = await api.get('/riders');
      setRiders(response.data);
    } catch (error) {
      console.error('Failed to fetch riders:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDemoRiders = async () => {
    try {
      await api.post('/riders/create-demo-riders');
    } catch (error) {
      console.error('Failed to create demo riders:', error);
    }
  };

  const toggleRiderStatus = async (riderId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'available' ? 'busy' : 'available';
      await api.patch(`/riders/${riderId}/status`, { status: newStatus });
      
      // Update local state immediately for better UX
      setRiders(prevRiders => 
        prevRiders.map(rider => 
          rider._id === riderId ? { ...rider, status: newStatus as 'available' | 'busy' } : rider
        )
      );
    } catch (error) {
      console.error('Failed to update rider status:', error);
    }
  };

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'bike': return '🏍️';
      case 'car': return '🚗';
      case 'scooter': return '🛵';
      case 'bicycle': return '🚲';
      default: return '🚴';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="border-b border-gray-200 pb-4 mb-4">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Rider Dashboard</h2>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Live Tracking</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{riders.length}</div>
          <div className="text-sm text-blue-800">Total Riders</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {riders.filter(r => r.status === 'available').length}
          </div>
          <div className="text-sm text-green-800">Available</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">
            {riders.filter(r => r.status === 'busy').length}
          </div>
          <div className="text-sm text-red-800">Busy</div>
        </div>
      </div>

      <div className="space-y-3">
        {riders.map((rider) => (
          <div
            key={rider._id}
            className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedRider?._id === rider._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
            onClick={() => setSelectedRider(rider)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getVehicleIcon(rider.vehicle_type)}</span>
                <div>
                  <div className="font-semibold text-gray-800">{rider.name}</div>
                  <div className="text-sm text-gray-600">{rider.phone}</div>
                  <div className="text-xs text-gray-500">
                    {rider.current_location.lat.toFixed(4)}, {rider.current_location.lng.toFixed(4)}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  rider.status === 'available' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {rider.status}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRiderStatus(rider._id, rider.status);
                  }}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    rider.status === 'available'
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {rider.status === 'available' ? 'Set Busy' : 'Set Available'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedRider && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2">Selected Rider Details</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium text-gray-600">Name:</span>
              <span className="ml-2 text-gray-800">{selectedRider.name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Vehicle:</span>
              <span className="ml-2 text-gray-800 capitalize">{selectedRider.vehicle_type}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Status:</span>
              <span className="ml-2 text-gray-800">{selectedRider.status}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Phone:</span>
              <span className="ml-2 text-gray-800">{selectedRider.phone}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
