import { Request, Response } from 'express';
import axios from 'axios';
import Rider from '../models/Rider';

export const getAllRiders = async (_req: Request, res: Response) => {
  try {
    const riders = await Rider.find();
    res.json(riders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getRiderById = async (req: Request, res: Response) => {
  try {
    let rider;
    if (req.params.id === 'demo-rider') {
      rider = await Rider.findOne({ name: 'John Rider' });
    } else {
      rider = await Rider.findById(req.params.id);
    }

    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }
    res.json(rider);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createRider = async (req: Request, res: Response) => {
  try {
    const rider = new Rider(req.body);
    const savedRider = await rider.save();
    res.status(201).json(savedRider);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateRiderStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['available', 'busy'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "available" or "busy".' });
    }

    let rider;
    if (req.params.id === 'demo-rider') {
      rider = await Rider.findOneAndUpdate(
        { name: 'John Rider' },
        { status },
        { new: true }
      );
    } else {
      rider = await Rider.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
    }

    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }
    res.json(rider);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateRiderLocation = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ message: 'Invalid coordinates. lat and lng must be numbers.' });
    }

    let rider;
    if (req.params.id === 'demo-rider') {
      rider = await Rider.findOneAndUpdate(
        { name: 'John Rider' },
        { current_location: { lat, lng } },
        { new: true }
      );
    } else {
      rider = await Rider.findByIdAndUpdate(
        req.params.id,
        { current_location: { lat, lng } },
        { new: true }
      );
    }

    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }
    res.json(rider);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createDemoRiders = async (_req: Request, res: Response) => {
  try {
    const demoRiders = [
      {
        name: 'John Rider',
        phone: '+1234567890',
        vehicle_type: 'bike',
        current_location: { lat: 40.7128, lng: -74.0060 },
        status: 'available'
      },
      {
        name: 'Sarah Rider',
        phone: '+1234567891',
        vehicle_type: 'scooter',
        current_location: { lat: 40.7580, lng: -73.9855 },
        status: 'available'
      },
      {
        name: 'Mike Rider',
        phone: '+1234567892',
        vehicle_type: 'car',
        current_location: { lat: 40.7489, lng: -73.9680 },
        status: 'busy'
      },
      {
        name: 'Emma Rider',
        phone: '+1234567893',
        vehicle_type: 'bike',
        current_location: { lat: 40.7282, lng: -73.9942 },
        status: 'available'
      },
      {
        name: 'Alex Rider',
        phone: '+1234567894',
        vehicle_type: 'bicycle',
        current_location: { lat: 40.7831, lng: -73.9712 },
        status: 'available'
      }
    ];

    await Rider.deleteMany({});
    const createdRiders = await Rider.insertMany(demoRiders);
    res.status(201).json(createdRiders);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getRiderDistance = async (req: Request, res: Response) => {
  try {
    const { customerLat, customerLng } = req.query;

    if (!customerLat || !customerLng) {
      return res.status(400).json({ message: 'Customer coordinates required (customerLat, customerLng)' });
    }

    let rider;
    if (req.params.id === 'demo-rider') {
      rider = await Rider.findOne({ name: 'John Rider' });
    } else {
      rider = await Rider.findById(req.params.id);
    }

    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'OpenRouteService API key not configured' });
    }

    const response = await axios.post(
      'https://api.openrouteservice.org/v2/directions/driving-car',
      {
        coordinates: [
          [rider.current_location.lng, rider.current_location.lat],
          [parseFloat(customerLng as string), parseFloat(customerLat as string)]
        ]
      },
      {
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const route = response.data.routes[0];
    const distance = route.summary.distance / 1000;
    const duration = route.summary.duration / 60;

    res.json({
      distance: Math.round(distance * 100) / 100,
      eta: Math.round(duration),
      rider_location: rider.current_location,
      customer_location: {
        lat: parseFloat(customerLat as string),
        lng: parseFloat(customerLng as string)
      }
    });
  } catch (error: any) {
    console.error('Distance calculation error:', error?.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to calculate distance',
      error: error?.response?.data || error.message
    });
  }
};
