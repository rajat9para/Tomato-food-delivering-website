'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import api from '../lib/axios';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

interface Location {
  lat: number;
  lng: number;
}

interface DistanceData {
  distance: number;
  eta: number;
  rider_location: Location;
  customer_location: Location;
}

export default function DeliveryMap() {
  const [riderLocation, setRiderLocation] = useState<Location>({ lat: 40.7128, lng: -74.0060 });
  const [customerLocation] = useState<Location>({ lat: 40.7580, lng: -73.9855 });
  const [distanceData, setDistanceData] = useState<DistanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fetchRiderData();
    calculateDistance();
    
    // Simulate rider movement
    const interval = setInterval(() => {
      simulateRiderMovement();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchRiderData = async () => {
    try {
      const response = await api.get('/riders');
      if (response.data.length > 0) {
        setRiderLocation(response.data[0].current_location);
      }
    } catch (err) {
      console.error('Failed to fetch rider data:', err);
    }
  };

  const calculateDistance = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/riders/demo-rider/distance?customerLat=${customerLocation.lat}&customerLng=${customerLocation.lng}`);
      setDistanceData(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to calculate distance');
    } finally {
      setLoading(false);
    }
  };

  const simulateRiderMovement = async () => {
    // Simulate small movement towards customer
    const newLat = riderLocation.lat + (customerLocation.lat - riderLocation.lat) * 0.02;
    const newLng = riderLocation.lng + (customerLocation.lng - riderLocation.lng) * 0.02;
    const newLocation = { lat: newLat, lng: newLng };
    
    setRiderLocation(newLocation);
    
    // Update rider location in database
    try {
      await api.patch('/riders/demo-rider/location', newLocation);
      // Recalculate distance
      calculateDistance();
    } catch (err) {
      console.error('Failed to update rider location:', err);
    }
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
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Live Delivery Map</h2>
        
        {loading && (
          <div className="text-sm text-gray-600">Calculating distance...</div>
        )}
        
        {error && (
          <div className="text-sm text-red-600">Error: {error}</div>
        )}
        
        {distanceData && !loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-lg font-semibold text-blue-800">
              Distance to Customer: {distanceData.distance} km | ETA: {distanceData.eta} mins
            </div>
          </div>
        )}
      </div>
      
      <div className="h-96 relative">
        <MapContainer
          center={[riderLocation.lat, riderLocation.lng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <Marker position={[riderLocation.lat, riderLocation.lng]}>
            <Popup>
              <div className="text-center">
                <div className="font-bold">🏍️ Rider</div>
                <div className="text-sm text-gray-600">
                  Status: Available
                </div>
              </div>
            </Popup>
          </Marker>
          
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
        </MapContainer>
      </div>
      
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            <span>Rider Location</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            <span>Customer Location</span>
          </div>
        </div>
      </div>
    </div>
  );
}
