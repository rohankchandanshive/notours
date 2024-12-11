const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema({
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    require: [true, 'Tour is required for booking!'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    require: [true, 'User is required for booking!'],
  },
  price: {
    type: Number,
    required: [true, 'price is required for booking!'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: true,
  },
});

bookingSchema.pre(/^find/, function (next) {
  this.populate([
    { path: 'tour', select: 'price name' },
    { path: 'user', select: 'name' },
  ]);
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
