const Review = require("../model/review");
const AppError = require("../utils/appError");
const asyncFunctionHandler = require("../utils/asyncFunctionHandler");
const factoryCtrl = require('./factoryController');

const setTourAndUserIds = (req,res,next) => {
    req.body.tour = req.body?.tour ?? req.params?.tourId 
    req.body.user = req.user?._id 
    console.log('req.tour',req.params ,req.body);
    if(!req.body.user){
        return next(new AppError('Please share user!'))
    }

    if(!req.body.tour){
        return next(new AppError('Please share tour!'))
    }
    next()
}

const addReview = factoryCtrl.createOne(Review)

// const reviewParamsHandler = () =>{}

const getReviews = factoryCtrl.findAll(Review)

const getReview = factoryCtrl.findOne(Review)

const updateReview = factoryCtrl.updateOne(Review);

const deleteReview = factoryCtrl.deleteOne(Review);

module.exports = {addReview,getReviews, deleteReview, setTourAndUserIds,updateReview,getReview};