const fs = require('fs');
const Tour = require('../model/tour');
const AppError = require('../utils/appError')
const ApiFeature = require('../utils/apiFeatures');
const asyncFnHandler = require('../utils/asyncFunctionHandler');
const factoryCtrl = require('./factoryController');
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`),
);

const multer = require('multer');
const sharp = require('sharp');
const asyncFunctionHandler = require('../utils/asyncFunctionHandler');

// // id error handler
// module.exports.checkId = (req,res,next,value)=>{ // already mongoDB gives unique ID so no need to check here
//   console.log('param id error handler',value);
//   if (tours.length < value) {
//       return res.status(404).send({
//         status: 'fail',
//         message: 'Invalid Id',
//       });
//     }
//     next();
// }

module.exports.checkBody =
  ('/:id',
  (req, res, next) => {
    console.log('body MW', !!Object.keys(req.body).length);
    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        status: 'failed',
        message: 'No body recieved to create/update the tour!',
      });
    }
    next();
  });

module.exports.top5Tours =
  ('/',
  (req, res, next) => {
    console.log('get top 5 tours');
    (req.query.sort = '-ratingsAverage,price'),
      (req.query.ratingsAverage = { gte: '4.5' });
    req.query.fields = 'name,duration,difficulty,ratingsAverage,price';
    req.query.limit = 5;
    next();
  });

  const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new AppError('Not an image! Please upload an image file', 400), false);
    }
  };

const multerMemoryStorage= multer.memoryStorage();

const upload = multer({
  storage: multerMemoryStorage,
  fileFilter: multerFilter,
});

module.exports.toursImgUpload = upload.fields([{name:'imageCover', maxCount: 1},{name:'images', maxCount: 3}])

module.exports.resizePhoto = asyncFunctionHandler(async(req,res,next) => {
  console.log('req.params',req.params);
  if(!req.files.imageCover || !req.files.images) return next();

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
  await sharp(req.files.imageCover[0].buffer).resize(2000,1333).toFormat('jpeg').jpeg({quality: 90}).toFile(`public/img/users/${req.body.imageCover}`);

  req.body.images=[]
  await Promise.all(req.files.images.map(async (file,idx) => {
    const fileName = `tour-${req.params.id}-${Date.now()}-${idx+1}.jpeg`
    await sharp(file.buffer).resize(2000,1333).toFormat('jpeg').jpeg({quality: 90}).toFile(`public/img/users/${fileName}`);
    req.body.images.push(fileName)
  } ))

  console.log('body images',req.body.images);
  next()
})

// REQUEST HANDLERS as func

module.exports.createTour = factoryCtrl.createOne(Tour);
// module.exports.createTour = asyncFnHandler(async (req, res,next) => {
//   // const newId = tours[tours.length - 1].id + 1;
//   // const newTour = Object.assign({ id: newId }, req.body);
//   // console.log('new Tour', newTour);
//   // tours.push(newTour);
//   // fs.writeFile(
//   //   `${__dirname}/dev-data/data/tours-simple.json`,
//   //   JSON.stringify(tours),
//   //   (err) => {
//   //     if (err)
//   //       return res
//   //         .status(500)
//   //         .send({ status: 'Failes', message: 'Failed Saving the Tour!' });
//   //     res.status(201).send({
//   //       message: 'success',
//   //       data: {
//   //         tour: newTour,
//   //       },
//   //     });
//   //   }
//   // );

//   const newTour = await Tour.create({
//     ...req.body,
//   });

//   res.status(201).json({
//     status: 'success',
//     tour: newTour,
//   });
// });

module.exports.getTours = asyncFnHandler(async (req, res,next) => {
  // res.status(200).json({
  //   status: 'success',
  //   result: tours.length,
  //   data: {
  //     tours,
  //   },
  // });
  console.log('reqest query',req.query)
  let features = new ApiFeature(Tour.find(), req.query)
    .filtering()
    .sorting()
    .fields()
    .pagination();
    console.log('features',features);
  const tours = await features.query;
  if(!tours.length){
    return next(new AppError('No tours found!',404));
  }

  res.status(200).json({
    status: 'success',
    length: tours.length,
    tour: tours,
  });
});

module.exports.getTour = factoryCtrl.findOne(Tour)

module.exports.updateTour = factoryCtrl.updateOne(Tour);

module.exports.deleteTour = factoryCtrl.deleteOne(Tour);

module.exports.getTourStats = asyncFnHandler(async (req, res,next) => {
  const tours = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 }, // every stage(match|groups) acts as accumultor so passing 1 will give th total number of tours because it gets added using $sum for each record that is looped
        totalRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        // tourNames: {$concat: ["$name"]}
      },
    },
    // {
    //   $project:{
    //     tourNames: 1,

    //   }
    // },
    {
      $sort: { numTours: 1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    message: {
      tours,
    },
  });
});

module.exports.getMonthlyPlan = asyncFnHandler(async (req, res,next) => {
  const year = req.params.year * 1;
  console.log('year', year);
  const toursPlan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
        // month:1,
        // numTours:1,
        // tours:1
      },
    },
    {
      $sort: { month: 1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    length: toursPlan?.length,
    message: {
      toursPlan,
    },
  });
});

module.exports.toursWithin = asyncFnHandler(async(req,res,next)=>{
  const { distance, latlng, unit} = req.params;
  
  const [lat,lng] = latlng.split(',');
  // calculate radius into radinants
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1 ;
  
  if(!lng || !lat){
    return next(new AppError('Please provide latitude and longitude in the format lat,lng'))
  }
  console.log('details',{radius,lat,lng,unit})
  const tours = await Tour.find({ startLocation : {
    $geoWithin: {
        $centerSphere:  [[lng,lat], radius]
    }}
 })
  res.status(200).json({
    status: 'success',
    count: tours.length,
    data:{
      tours
    }
  })
})

module.exports.distances = asyncFnHandler(async(req,res,next) => {
  const { distance, latlng, unit} = req.params;
  
  const [lat,lng] = latlng.split(',');
  // calculate radius into radinants
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001 ;
  const tours = await Tour.aggregate([
    {
      $geoNear:{
        near: {
          type: 'Point',
          coordinates: [lng*1,lat*1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,       // multiplier used to get the values in MI and Unit need to pass the values in METERS
      }
    },
    {
      $project:{
        name:1,
        distance: 1
      }
    }
  ])
  res.status(200).json({
    status: 'success',
    count: tours.length,
    data:{
      tours
    }
  })
})
