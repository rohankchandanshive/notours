const express = require('express');
const app = express();
const morgan = require('morgan');
const usersRoute = require('./routers/usersRoute');
const toursRoute = require('./routers/toursRoute');
const reviewRoute = require('./routers/reviewRoute');

const globalErrorHandler = require('./controller/errorController');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const expressMongoSanitize= require('express-mongo-sanitize');
const xss = require('xss-clean')
const hpp=require('hpp');
const AppError = require('./utils/appError');
const path = require('path');
const bookingRoute = require('./routers/bookingRoute');
const BookingCtrl = require('./controller/bookingController');
const serverless = require('serverless-http');


// MIDDLEWARES
app.use(helmet());  // should be added at top so the security headers can be added to all requests

app.set('view engine','pug');
app.set('views',path.join(__dirname,'views'))


app.get('/',BookingCtrl.createBookingCheckout,(req,res)=>{
    return res.status(200).render('dash')
})

app.get('/payment-failed',(req,res)=>{
    return res.status(200).render('payment-failed')
})

app.get('/payment-success',(req,res)=>{
    return res.status(200).render('payment-success')
})

// MW to load static html files
app.use(express.static(`${__dirname}/public`))

// Limiting the number of request accepeted under certain period of time (Rate Limiting) 
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests, please try again in an hour.',
})  
// app.use(limiter);
app.use('/api',limiter); // we can add limiter to specific endpoints

//Body parser, to get the body as json from req.bidy
app.use(express.json({
    limit: '10kb'        // adding limit to the req.body to be accepted under specified limit
}));

// Sanitizing Query injection below MW replaces the $ operator of query which makes it unexecutable
app.use(expressMongoSanitize())

// Sanitize the body, params and query by replacing the html tags with entities eg: &lt;h1>bad name&lt;h2>
app.use(xss())

//Handled http params populating - used to break the application by passing multiple params eg: sort=3&sort=9
app.use(hpp({
    whitelist: ['duration']
}))



//MW to add logs for dev env's
app.use(morgan('dev'));
// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

//formating to achieve more readiability

// app.get('/api/v1/tours', getTours);
// app.get('/api/v1/tours/:id', getTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);
// app.post('/api/v1/tours', createTour);

//We can combine the routes having same url path - ROUTES

//ROUTES

app.use('/api/v1/tours', toursRoute);
app.use('/api/v1/users', usersRoute);
app.use('/api/v1/reviews', reviewRoute);
app.use('/api/v1/bookings', bookingRoute);





// app.get('/',())

app.all('*',(req,res,next)=>{
    // return res.status(404).json({
    //     status: 'fail',
    //     message: 'This route doesnt exists!'
    // })
    next(new AppError(`Cant find the requested url ${req.originalUrl} on server.`,404));    // Managed through custom Error handler
})

app.use(globalErrorHandler)
app.use('/.netlify/functions/server/api/v1/tours', toursRoute);
app.use('/.netlify/functions/server/api/v1/users', usersRoute);
app.use('/.netlify/functions/server/api/v1/reviews', reviewRoute);
app.use('/.netlify/functions/server/api/v1/bookings', bookingRoute);
module.exports = app ;
module.exports.handler = serverless(app); 
