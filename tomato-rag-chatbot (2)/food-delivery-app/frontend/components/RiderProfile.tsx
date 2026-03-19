'use client';

import { useState, useEffect } from 'react';
import api from '../lib/axios';

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

export default function RiderProfile() {
  const [rider, setRider] = useState<Rider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For demo purposes, using a fixed rider ID that will be created
  const riderId = 'demo-rider';

  useEffect(() => {
    fetchRider();
  }, []);

  const fetchRider = async () => {
    try {
      setLoading(true);
      // First try to get existing rider
      const response = await api.get(`/riders/${riderId}`);
      setRider(response.data);
    } catch (err: any) {
      // If rider doesn't exist, create a demo rider
      if (err.response?.status === 404) {
        await createDemoRider();
      } else {
        setError('Failed to fetch rider data');
      }
    } finally {
      setLoading(false);
    }
  };

  const createDemoRider = async () => {
    try {
      const demoRider = {
        name: 'John Rider',
        phone: '+1234567890',
        vehicle_type: 'bike',
        current_location: {
          lat: 40.7128,
          lng: -74.0060
        },
        status: 'available'
      };

      const response = await api.post('/riders', demoRider);
      setRider(response.data);
    } catch (err) {
      setError('Failed to create demo rider');
    }
  };

  const toggleAvailability = async () => {
    if (!rider) return;

    try {
      const newStatus = rider.status === 'available' ? 'busy' : 'available';
      const response = await api.patch(`/riders/${rider._id}/status`, { status: newStatus });
      setRider(response.data);
    } catch (err) {
      setError('Failed to update availability');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (error || !rider) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
        <p className="text-gray-600">{error || 'No rider data available'}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Rider Profile</h2>
      
      <div className="space-y-3">
        <div className="flex items-center">
          <span className="font-semibold text-gray-600 w-24">Name:</span>
          <span className="text-gray-800">{rider.name}</span>
        </div>
        
        <div className="flex items-center">
          <span className="font-semibold text-gray-600 w-24">Phone:</span>
          <span className="text-gray-800">{rider.phone}</span>
        </div>
        
        <div className="flex items-center">
          <span className="font-semibold text-gray-600 w-24">Vehicle:</span>
          <span className="text-gray-800 capitalize">{rider.vehicle_type}</span>
        </div>
        
        <div className="flex items-center">
          <span className="font-semibold text-gray-600 w-24">Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            rider.status === 'available' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {rider.status}
          </span>
        </div>
        
        <div className="flex items-center">
          <span className="font-semibold text-gray-600 w-24">Location:</span>
          <span className="text-gray-800 text-sm">
            {rider.current_location.lat.toFixed(4)}, {rider.current_location.lng.toFixed(4)}
          </span>
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={toggleAvailability}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            rider.status === 'available'
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {rider.status === 'available' ? 'Set as Busy' : 'Set as Available'}
        </button>
      </div>
    </div>
  );
}
