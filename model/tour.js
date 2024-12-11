const mongoose = require('mongoose');
const review = require('./review');
const User = require('./user')

const tourSchema = new mongoose.Schema(
  {
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    name: {
      type: String,
      unique: true,
      required: [true, 'Tour Name is required!'],
      // minLength: [3, "Name should be atleast of 3 letters"] // built in validations
      minLength: [3, 'Tour name should be atleast of 3 length'],
    },
    tourSlugName: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, 'Tour Duration is required!'],
    },
    difficulty: {
      type: String,
      required: [true, 'Tour Difficulty is required!'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Tour group size is required'],
      trim: true,
    },
    summary: {
      type: String,
      required: [true, 'Tour Summary is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: [true, 'Tour description is required'],
    },
    imageCover: {
      type: String,
      required: [true, 'Tour Image is required'],
    },
    images: [String],
    startDates: {
      type: [Date],
      required: [true, 'Tour start dates are required'],
    },
    price: { type: Number, required: [true, 'Price is required!'] },
    discountPrice: {
      type: Number,
      validate: {
        validator: function (val) {
          // val we get the value of the field in validate fn i.e discountPrice
          console.log('custom validation', this, val);
          return this.price > this.discountPrice;
        },
        message: 'Discount price ({VALUE}) is more than actual price', // ({VALUE}) represents the dynamic value that we pass to discountPrice field
      },
    },
    ratingsQuantity: {
      type: Number,
      // required: [true, 'Rating Quantity is required!'],
    },
    ratingsAverage: {
      type: Number,
      // required: [true, 'Rating Average is required!'],
      min: [0, 'Rating should be greater than 0'],
      max: [5, 'Rating should be less than 5'],
      set: (value)=> Math.floor(value * 10) /10
    },
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type:{
        type: String,
        default: "Point",
        enum: ["Point"]
      },
      coordinates: [Number],
      description: String,
      address: String,
      day: Number,
    },
    locations: [{
      type:{
        type: String,
        default: "Point",
        enum: ["Point"]
      },
      coordinates: [Number],
      description: String,
      address: String,
      day: Number,
    }],
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    guides: Array       // Ex for embedding data model (please check its presave MW and data in document)
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

tourSchema.index({startLocation: '2dsphere'})

tourSchema.virtual('durationInWeek').get(function(next){      // virtualize a field only fly while getting the doc rather than saving the property in mongodb
  return this.duration / 7 ;
})

//Virtual populate child refrencing for tour -> Review
tourSchema.virtual('reviews',{
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
})

//Document middleware
// PreSave Middleware
tourSchema.pre('save',function(next){      // by using it we can add some thing using middleware in mongoDB before saving doc
  this.tourSlugName = this.name.replaceAll(' ','-'); 
  next();
})

tourSchema.pre('save',async function(next){
  // console.log('guides', await this.guides.map(async id => await User.findById(id)));
  const guidesPromise = this.guides.map(async id => await User.findById(id));
   
  // console.log('guide Promise',guidesPromise);
  this.guides = await Promise.all(guidesPromise);
  next()
})

// PostSave Middleware
tourSchema.post('save',function(next){      // by using it to see the saved doc or process something after doc is saved
  console.log('Doc saved successfully!')
})

//Query Middleware
tourSchema.pre('find',function(next){      // We can change or manipulate a query before/after using (pre/post MW) executing it on DB
  this.find({secretTour: {$ne: true}})
  next();
})

tourSchema.pre(/^find/,function(next){      // We can change or manipulate a query before/after using (pre/post MW) executing it on DB
  // console.log('find query MW exec >>>>',)
  this.populate('users');
  next();
})

tourSchema.pre(/^find/,function(next){      // We can change or manipulate a query before/after using (pre/post MW) executing it on DB
  // console.log('find query MW exec >>>>',)
  this.populate({path:'reviews'});
  next();
})
  
//Aggregation MW      // applies to the aggregation queries
tourSchema.pre('aggregate',function(next){
  console.log('aggregate MW', this._pipeline)
  // this._pipeline.unshift({$match:{secretTour: {$ne: true}}});
  // console.log('aggregate MW after', this._pipeline)

  next()
})
  
module.exports = mongoose.model('Tour',tourSchema);