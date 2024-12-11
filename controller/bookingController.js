const Booking = require("../model/booking");
const Tour = require("../model/tour")
const factoryCtrl = require("../controller/factoryController")

const asyncFunctionHandler = require("../utils/asyncFunctionHandler");
const stripe = require('stripe')(`${process.env.STRIPE_SECRET_KEY}`)

exports.createSession = asyncFunctionHandler(async(req,res)=>{
    try{
    // 1. get the tours detail
    const tour = await Tour.findById(req.params.tourId);
    console.log('success url',`http://localhost:2024?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`);

    // 2. create session object with required data

    const sessionObject = await stripe.checkout.sessions.create({
        line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `${tour.name}-tour`,
                },
                unit_amount: tour.price,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `http://localhost:2024?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
          cancel_url: 'http://localhost:2024/payment-failed',
    })

    res.status(200).json({
        message: 'success',
        session: sessionObject
    })}catch(err){
        console.log('Erroe creating session',err)
    }

})

exports.createBookingCheckout = asyncFunctionHandler(async(req,res,next)=>{
    const {tour,user,price}=req.query;
    console.log('create Booking MW',req.originalUrl)
    if(!tour && !user && !price) return next();
    await Booking.create({tour,user,price});
    res.redirect('http://localhost:2024/')
})

exports.createBooking = factoryCtrl.createOne(Booking);

exports.getBooking = factoryCtrl.findOne(Booking);

exports.getAllBookings = factoryCtrl.findAll(Booking);

exports.updateBooking = factoryCtrl.updateOne(Booking);

exports.deleteBooking = factoryCtrl.deleteOne(Booking);


