const User = require('../model/user');
const asyncFnHandler = require('../utils/asyncFunctionHandler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/appError');
const {promisify} = require('util');
const crypto = require('crypto');
const Email = require('../utils/email');

const signToken = async(id)=>{
    return await jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXP
      })
}

const sendWithToken = async(message,user,res)=>{
  const token = await signToken(user._id);
  user.password = undefined;
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPS_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
  }
  if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt',token,cookieOptions)
  res.status(200).json({
    status: 'success',
    message: message,
    user: user,
    authToken: token
  });
}

const signUp = asyncFnHandler(async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    password: req.body.password,
    email: req.body.email,
    confirmPassword: req.body.confirmPassword,
    passwordChangedAt: req.body.passwordChangedAt,
    role:req.body.role
  });
  const url=`${req.protocol}://www.google.com`;
  await new Email(newUser,url).sendWelcome();
  sendWithToken('User created successfully',newUser,res)
  // const token = await signToken(newUser._id)
  // res.status(200).json({
  //   status: 'success',
  //   message: 'User created successfully',
  //   user: newUser,
  //   authToken: token
  // });
});

const login = asyncFnHandler(async(req,res,next)=>{
    const {email, password} = req.body;

    //1) Check if the email and password exists
    if(!email || !password){
        returnnext(new AppError(`Please provide email and passowrd!`,400))
    }

    //2) Check if user exists and password is correct
    const user = await User.findOne({email: email}).select('+password');    // To get the password property in object we enabled it explicitly
    if(!user) {
        return next(new AppError(`User not found!`,404))    // adding return to end login function and not call the res again after res is sent alredy by global error handler
    } 
    console.log('user',user.password,password)
    const isUserValid = await user.correctPassword(password, user.password);
    if(!isUserValid){
        return next(new AppError(`Invalid Password`,401))
    }

    //3) Generate a new token for User
  sendWithToken('User Logged In successfully!',user,res)

    // const token = await signToken(user._id)
    // res.status(200).json({
    //   status: 'success',
    //   message: "User Logged In successfully!",
    //   authToken: token
    // });

});

const authenticate = asyncFnHandler(async(req,res,next) => {
  console.log('req',req.headers)
  let token;
  //1. Check if header has token
  if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
    token = req.headers.authorization.split(' ')[1];
  }
  console.log('token',token)

  if(!token){
    return next(new AppError('Dont have a token. You havent loggedIn',401)); 
  }
  //2. Verify Token
  const decodedToken = await promisify(jwt.verify)(token,process.env.JWT_SECRET);
  console.log('decodedToken',decodedToken);
  //Error of jwt is handled in global handler
 
  //3.CHeck if user exists with the token provided
  const currentUser = await User.findById({_id: decodedToken.id});
  console.log('User',currentUser);
  if(!currentUser){
    next(new AppError('User not found for the provided token!',401))
  }
  //4. Check if password was not changes after token generated
  const hasPassordChanged = currentUser.isPasswordChanged(decodedToken.iat);
console.log('hasPassordChanged',hasPassordChanged) ;
  if(hasPassordChanged){
    return next(new AppError('Password has been changed since token was generated',401))
  }
  //5. Grant access to protected route
  req.user = currentUser;
  next()
})

const authorize = (...roles) =>{
  return (req,res,next)=>{
    if(!roles.includes(req.user.role)){
      return next(new AppError('You dont have permission to perform this action',403))
    }
  next();
  }
}

const forgotPassword = asyncFnHandler(async(req,res) =>{
  const {email} = req.body;
  //1.) If user exists with the email to reset password for
  const user = await User.findOne({email});
  console.log('user',!!user);
  if(!user){
    return next(new AppError('User does not exist with the provided email',404))
  }

  //2.Generate random password
  const resetToken = user.generatePasswordResetToken();
  await user.save({validateBeforeSave: false})
  console.log('reset token',resetToken)
  // user.save()
  //3. share the generated password through email
  try{
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
    // await sendEmail({
    //   to: user.email,
    //   subject: 'Your password reset token',
    //   message: `Want to reset password please visit URL ${resetUrl} and share the password and confirmPassword as json!`
    // })
    new Email(user,resetUrl).forgotPasswordSend();
    console.log('after>>>>>')
    return res.status(200).json({
      status: 200,
      message: 'Reset token sent to email successfully!'
    })

  }catch(err){
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    return new AppError('Error sending email!',500)
  }
})

const resetPassword = asyncFnHandler(async(req,res,next) => {
  // 1. Get the token from id
  const resetToken = req.params.token;
  const { password, confirmPassword } = req.body;
  const encryptedResetToken =  crypto.createHash('sha256').update(resetToken).digest('hex');
  
  // 2. Check if user exists and had generated a resetToken
  const user = await User.findOne({passwordResetCode: encryptedResetToken,passwordResetExpires: { $gt : Date.now() }});

  // return res.status(200).json({
  //   message: 'WIP ....'
  // })
  if(!user){
    return next(new AppError('User does not exist or Token is Invalid!',404))
  }
 
  // 3. Reset the password with shared password,
  user.password = password;
  user.confirmPassword = confirmPassword;
  user.passwordChangedAt = Date.now();
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 4.The passwordChangedAt field should be updated
  // Added logic in pre save to automaically update the passwordChangeAt when we update the user.password

  // 5.Login the user and send the jwt  
  sendWithToken('Password reset successfully!',user,res)

  // const token = await signToken(user._id)
  // res.status(200).json({
  //   status: 'success',
  //   message: 'Password reset successfully!',
  //   authToken:token
  // })
})

const updatePassword = asyncFnHandler (async (req,res,next) => {
  console.log('req recieved',req.user,req.body)
  const {currentPassword, newPassword,confirmNewPassword} = req.body;
  // 1. Get the user from the mongo
    const user = await User.findById({_id:req.user.id}).select('+password');
  console.log('user',user)
  // 2. Check if currenPassword recieved matches with the user.password
  const isUserValid = await user.correctPassword(currentPassword,user.password);

  if(!isUserValid){
    return next(new AppError('The current password provided is Invalid!',401))
  }

  // 3.Update the password if it matches
  user.password = newPassword;
  user.confirmPassword = confirmNewPassword;
  await user.save()   // Used save to call pre save middleware of user model that checks the password's
  // return res.status(200).json({
  //   message: 'WIP ....'
  // })
  // 4.login the user with jwt sign in token
  sendWithToken('Password updated successfully',user,res)

  // const token = await signToken(user._id);
  // res.status(200).json({
  //   status: "success",
  //   message: "Password updated successfully",
  //   authToken: token
  // })
})


module.exports = {signUp, login,authenticate,authorize,forgotPassword,resetPassword,updatePassword}