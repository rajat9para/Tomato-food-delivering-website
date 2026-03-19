const express = require('express');
const router = express.Router();
const Rider = require('../models/Rider');
const axios = require('axios');

// Get all riders
router.get('/', async (req, res) => {
  try {
    const riders = await Rider.find();
    res.json(riders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create multiple demo riders
router.post('/create-demo-riders', async (req, res) => {
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

    // Clear existing demo riders
    await Rider.deleteMany({});

    // Insert new demo riders
    const createdRiders = await Rider.insertMany(demoRiders);
    
    // Broadcast update to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.to('rider-tracking').emit('riders-updated', createdRiders);
    }

    res.status(201).json(createdRiders);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get a single rider by ID or custom ID
router.get('/:id', async (req, res) => {
  try {
    let rider;
    // Try to find by custom field first (for demo rider)
    if (req.params.id === 'demo-rider') {
      rider = await Rider.findOne({ name: 'John Rider' });
    } else {
      rider = await Rider.findById(req.params.id);
    }
    
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }
    res.json(rider);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new rider
router.post('/', async (req, res) => {
  try {
    const rider = new Rider(req.body);
    const savedRider = await rider.save();
    res.status(201).json(savedRider);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update rider availability
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['available', 'busy'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    let rider;
    // Try to find by custom field first (for demo rider)
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
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update rider location
router.patch('/:id/location', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }

    let rider;
    // Try to find by custom field first (for demo rider)
    if (req.params.id === 'demo-rider') {
      rider = await Rider.findOneAndUpdate(
        { name: 'John Rider' },
        { 
          current_location: { lat, lng }
        },
        { new: true }
      );
    } else {
      rider = await Rider.findByIdAndUpdate(
        req.params.id,
        { 
          current_location: { lat, lng }
        },
        { new: true }
      );
    }

    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    // Broadcast real-time update to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.to('rider-tracking').emit('rider-location-updated', rider);
    }

    res.json(rider);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Calculate distance and ETA between rider and customer
router.get('/:id/distance', async (req, res) => {
  try {
    const { customerLat, customerLng } = req.query;
    
    if (!customerLat || !customerLng) {
      return res.status(400).json({ message: 'Customer coordinates required' });
    }

    let rider;
    // Try to find by custom field first (for demo rider)
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
      `https://api.openrouteservice.org/v2/directions/driving-car`,
      {
        coordinates: [
          [rider.current_location.lng, rider.current_location.lat],
          [parseFloat(customerLng), parseFloat(customerLat)]
        ]
      },
      {
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    const route = response.data.routes[0];
    const distance = route.summary.distance / 1000; // Convert to km
    const duration = route.summary.duration / 60; // Convert to minutes

    res.json({
      distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
      eta: Math.round(duration),
      rider_location: rider.current_location,
      customer_location: {
        lat: parseFloat(customerLat),
        lng: parseFloat(customerLng)
      }
    });

  } catch (error) {
    console.error('Distance calculation error:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Failed to calculate distance',
      error: error.response?.data || error.message 
    });
  }
});

module.exports = router;
