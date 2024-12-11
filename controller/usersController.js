const User = require('../model/user');
const AppError = require('../utils/appError');
const asyncFnHandler = require('../utils/asyncFunctionHandler');
const factoryCtrl = require('./factoryController');
const multer = require('multer');
const sharp = require('sharp');

const multerDiskStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    console.log('inside multer MW', file);
    cb(null, 'public/img/users');
  },
  filename: function(req, file, cb){
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
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

module.exports.resizePhoto = (req,res,next) => {
  if(!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  sharp(req.file.buffer).resize(500,500).toFormat('jpeg').jpeg({quality: 90}).toFile(`public/img/users/${req.file.filename}`);
  next()
}

module.exports.userPhotoUpload = upload.single('photo');

const filterObj = (obj,...allowedKeys)=>{
    console.log('filtered obj before',obj)

    Object.keys(obj).forEach(key => {
        if (!allowedKeys.includes(key)) delete obj[key];
    })
    console.log('filtered obj',obj)
    return obj;
}

module.exports.createUser = asyncFnHandler(async (req, res) => {

  res.status(200).json({
    status: 'success',
    message: 'This route is not defined, please use /signUp route instead!',
  });
});

module.exports.getUsers = factoryCtrl.findAll(User);

module.exports.getUser = factoryCtrl.findOne(User)

module.exports.updateUser = factoryCtrl.updateOne(User);

module.exports.deleteUser = factoryCtrl.deleteOne(User);

module.exports.updateMe = asyncFnHandler(async (req,res,next)=>{
  console.log('req.file',req.file);
  console.log('req.body',req.body);
  
  //1.Throw error if password is provided to update
  if(req.body.password || req.body.confirmPassword){
    return next(new AppError('PLease dont pass password to this endpoint we have /updatePassword for updating password!',400)); 
  }
  
  //2.filtering the object passed in req to only required properties that this endpoint supports
  const filterPayload = filterObj(req.body,'name','email','password','photo');
  
  if(req.file){
    filterPayload.photo = req.file.filename;
    console.log('req.body.photo',req.body)
  }
    const updatedUser = await User.findByIdAndUpdate({_id:req.user.id},filterPayload,{new: true, runValidators: true});  // new to get the updated User not old one and runValidators to run validator
  
return res.status(200).json({
    status:'success',
    data:{
        user:updatedUser
    }
  })
});


module.exports.deleteMe = asyncFnHandler(async (req,res,next)=>{
    console.log('req.user',req.user)

    const updatedUser = await User.findByIdAndUpdate({_id:req.user.id},{active: false},{new: true, runValidators: true});  // new to get the updated User not old one and runValidators to run validator
  
return res.status(204).json({
    status:'success',
    data: null
  })
})
