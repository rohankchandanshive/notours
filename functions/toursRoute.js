const express = require('express');
const { authenticate, authorize } = require('../controller/authController');
const toursController = require('../controller/toursController');
const ReviewRouter = require('./reviewRoute');

const toursRouter = express.Router();

//add Reviews On Tours using mergeRouter
toursRouter.use('/:tourId/reviews',ReviewRouter)

// toursRouter.param('id',toursController.checkId)  
toursRouter.route('/top-5-tours').get(toursController.top5Tours,toursController.getTours)
toursRouter.route('/tourStats').get(toursController.getTourStats);
toursRouter.route('/monthly-plan/:year').get(toursController.getMonthlyPlan);

toursRouter.route('/tours-within/:distance/center/:latlng/unit/:unit').get(toursController.toursWithin)
toursRouter.route('/distance/center/:latlng/unit/:unit').get(toursController.distances)


toursRouter.route('/').get(toursController.getTours).post(authenticate,authorize('admin','lead-guide'),toursController.checkBody,toursController.createTour);
toursRouter.route('/:id',).get(toursController.getTour).patch(authenticate,authorize('admin','lead-guide'),toursController.toursImgUpload,toursController.resizePhoto,toursController.checkBody,toursController.updateTour).delete(authenticate,authorize('admin','lead-guide'),toursController.deleteTour);

module.exports = toursRouter;
