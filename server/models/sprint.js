const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a sprint name'],
    trim: true,
    maxlength: [100, 'Sprint name cannot be more than 100 characters']
  },
  goal: {
    type: String,
    trim: true,
    maxlength: [500, 'Sprint goal cannot be more than 500 characters']
  },
  startDate: {
    type: Date,
    required: [true, 'Please specify start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please specify end date']
  },
  status: {
    type: String,
    required: true,
    enum: ['planning', 'active', 'completed'],
    default: 'planning'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  completedAt: {
    type: Date,
    default: null
  },
  memberCapacities: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      capacity: {
        type: Number,
        default: 10
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Sprint', sprintSchema);
