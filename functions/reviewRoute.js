
const express = require('express');
const { authenticate, authorize } = require('../controller/authController');
const ReviewController = require('../controller/reviewController');

const reviewRoute = express.Router({mergeParams: true});

// reviewRoute.route('/')
reviewRoute.route('/').get(authenticate,ReviewController.setTourAndUserIds ,ReviewController.getReviews).post(authenticate,authenticate,authorize('admin','user'),ReviewController.setTourAndUserIds,ReviewController.addReview);
reviewRoute.route('/:id').get(authenticate,ReviewController.getReview).patch(authenticate,authorize('admin','user'),ReviewController.updateReview).delete(authenticate,authorize('admin'),ReviewController.deleteReview);

module.exports = reviewRoute;