const AppError = require('../utils/appError');
const devErrorHandler = (err, res) => {
  return res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const prodErrorHandler = (err, res) => {
    //known errors 
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {  // Unknown errors
    console.error('error 💥',err)       // to log the error in the application logger where app is deployed
    return res.status(500).json({
      status: 'error',
      message: 'Something terribly went wrong!',
    });
  }
};

const handleDuplicateErrors = (err) => {
  return new AppError(
    `Duplicate record exists with ${JSON.stringify(err.keyValue)} `,
    400,
  );
};

const handleValidationErrors = (err) => {
  return new AppError(`${err.name}. ${JSON.stringify(err.message)} `, 400);
};

const handleCastErrorDB = (err) => {
  return new AppError(`Invalid ${err.path} : ${err.value[err.path]} `, 400);
};

const handleJsonWebTokenError = (err) => {
  return new AppError(`${err.name}:${err.message}`,401);
}

const handleTokenExpiredError = (err) => {
  return new AppError(`${err.name}:${err.message}`,401);
}


module.exports = (err, req, res, next) => {
  console.log(
    'env',
    process.env.NODE_ENV,
    typeof process.env.NODE_ENV,
    process.env.NODE_ENV.trim() === 'development',err.name
  );

  console.log('Global error handler!', err,err.message,err.stack);
  err.statusCode = err?.statusCode || 500;
  err.status = err?.status || 'error';

  if (err.name === 'CastError') err = handleCastErrorDB(err);
  if (err.name === 'ValidationError') err = handleValidationErrors(err);
  if (err.code === 11000) err = handleDuplicateErrors(err);
  if (err.name === 'JsonWebTokenError') err = handleJsonWebTokenError(err);
  if (err.name === 'TokenExpiredError') err = handleTokenExpiredError(err);
  else err.message = err?.message || 'Something went wrong!';

  if (process.env.NODE_ENV.trim() === 'development') {
    devErrorHandler(err, res);
  } else if (process.env.NODE_ENV.trim() === 'production') {
    prodErrorHandler(err, res);
  }
};
