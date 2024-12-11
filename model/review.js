const mongoose= require('mongoose');

const reviewSchema = mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review cannot be empty'],
    },
    rating:{
        type:Number,
        min: 1,
        max:5
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        required: [true, "Review must belong to tour!"],
        // ref: 'Tour'
    },
    user: {
        type:mongoose.Schema.ObjectId,
        required: [true, "Review must belong to user!"],
        // ref: 'User'
    }
},
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
}
)

reviewSchema.pre('find',function(next){
    this.populate({path: 'user', model: 'User', select: 'name role email'})
    next()
})

reviewSchema.statics.getNumberOfRatingAndAverageByTour = async function(tourId){
    console.log('tourId in stats',tourId)
    const stats = await this.aggregate([{ $match: { tour: tourId}},{$group: {
        _id: "$tour",
        nRating: {$sum: 1},
        avgRating: { $avg: "$rating"}
    }}]);
    console.log('rating', stats);
const Tour = require('./tour');
    await Tour.findByIdAndUpdate(tourId, {ratingsQuantity: stats.length > 0 ? stats[0].nRating : 0 ,ratingsAverage: stats.length > 0 ? stats[0].avgRating : 4.5});
    
}

reviewSchema.post('save',function(){
    console.log('called static function after save',this.tour);
    this.constructor.getNumberOfRatingAndAverageByTour(this.tour);
})

reviewSchema.pre(/^findOneAnd/,async function(next){
    this.r = await this.findOne();
    next();
})


reviewSchema.post(/^findOneAnd/,async function(){
    //The findOne query will not execute here as it is post MW which executed after the query
    this.r.constructor.getNumberOfRatingAndAverageByTour(this.r.tour);
})
module.exports = mongoose.model('Review',reviewSchema);