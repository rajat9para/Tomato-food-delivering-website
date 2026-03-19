const mongoose = require('mongoose');

const riderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  vehicle_type: {
    type: String,
    required: true,
    enum: ['bike', 'car', 'scooter', 'bicycle']
  },
  current_location: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    required: true,
    enum: ['available', 'busy'],
    default: 'available'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Rider', riderSchema);
