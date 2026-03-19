'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import api from '../lib/axios';
import { io, Socket } from 'socket.io-client';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

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

interface Location {
  lat: number;
  lng: number;
}

export default function MultiRiderMap() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [customerLocation] = useState<Location>({ lat: 40.7580, lng: -73.9855 });
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [simulationActive, setSimulationActive] = useState(true);

  useEffect(() => {
    setIsClient(true);
    
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
    
    if (simulationActive) {
      const interval = setInterval(() => {
        simulateRiderMovements();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [simulationActive]);

  const fetchRiders = async () => {
    try {
      const response = await api.get('/riders');
      setRiders(response.data);
    } catch (error) {
      console.error('Failed to fetch riders:', error);
    }
  };

  const createDemoRiders = async () => {
    try {
      await api.post('/riders/create-demo-riders');
    } catch (error) {
      console.error('Failed to create demo riders:', error);
    }
  };

  const simulateRiderMovements = async () => {
    // Simulate movement for all available riders
    const availableRiders = riders.filter(r => r.status === 'available');
    
    for (const rider of availableRiders) {
      // Simulate small random movement
      const latChange = (Math.random() - 0.5) * 0.002; // Small random movement
      const lngChange = (Math.random() - 0.5) * 0.002;
      
      const newLocation = {
        lat: rider.current_location.lat + latChange,
        lng: rider.current_location.lng + lngChange
      };

      try {
        await api.patch(`/riders/${rider._id}/location`, newLocation);
      } catch (error) {
        console.error(`Failed to update location for ${rider.name}:`, error);
      }
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

  const getMarkerColor = (status: string) => {
    return status === 'available' ? 'blue' : 'red';
  };

  if (!isClient) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Live Multi-Rider Tracking</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Busy</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Customer</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {riders.filter(r => r.status === 'available').length} Available | 
              {riders.filter(r => r.status === 'busy').length} Busy
            </span>
            {socket && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600">Live</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSimulationActive(!simulationActive)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              simulationActive
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {simulationActive ? 'Stop Simulation' : 'Start Simulation'}
          </button>
        </div>
      </div>
      
      <div className="h-96 relative">
        <MapContainer
          center={[customerLocation.lat, customerLocation.lng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Customer Marker */}
          <Marker position={[customerLocation.lat, customerLocation.lng]}>
            <Popup>
              <div className="text-center">
                <div className="font-bold">📍 Customer</div>
                <div className="text-sm text-gray-600">
                  Delivery Location
                </div>
              </div>
            </Popup>
          </Marker>
          
          {/* Rider Markers */}
          {riders.map((rider) => (
            <Marker
              key={rider._id}
              position={[rider.current_location.lat, rider.current_location.lng]}
            >
              <Popup>
                <div className="text-center">
                  <div className="font-bold">
                    {getVehicleIcon(rider.vehicle_type)} {rider.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    Status: {rider.status}
                  </div>
                  <div className="text-xs text-gray-500">
                    {rider.vehicle_type}
                  </div>
                  <button
                    onClick={() => setSelectedRider(rider)}
                    className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    Select Rider
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      
      {selectedRider && (
        <div className="p-4 bg-blue-50 border-t border-blue-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-blue-800">
                {getVehicleIcon(selectedRider.vehicle_type)} {selectedRider.name}
              </h3>
              <p className="text-sm text-blue-600">
                {selectedRider.vehicle_type} • {selectedRider.status} • {selectedRider.phone}
              </p>
            </div>
            <button
              onClick={() => setSelectedRider(null)}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
