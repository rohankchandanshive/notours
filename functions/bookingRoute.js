const express = require('express');
const { authenticate, authorize } = require('../controller/authController');
const BookingCtrl = require('../controller/bookingController');

const bookingRoute = express.Router();
bookingRoute.use(authenticate);
bookingRoute.get('/checkout-session/:tourId',authenticate,BookingCtrl.createSession);

bookingRoute.route('/').post(BookingCtrl.createBooking).get(BookingCtrl.getAllBookings);
bookingRoute.route('/:id').get(BookingCtrl.getBooking).patch(BookingCtrl.updateBooking).delete(BookingCtrl.deleteBooking);

module.exports = bookingRoute;