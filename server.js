const dotenv = require('dotenv');
const mongoose = require('mongoose')

dotenv.config({path:'./local.env'});
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

process.on('uncaughtException',(err)=>{
  console.log('UNHANDLE EXCEPTION 💥',err.name ,err.message)
  // app.stop(()=>{
    process.exit(1);
    // })
  })
  const connStr = process.env.DB_CONNECTION_STRING.replace('<db_username>',process.env.DB_USERNAME).replace('<db_password>',process.env.DB_PASSWORD);
const app = require('./index');
mongoose.connect(connStr,{
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false
}).then(()=> console.log('Connected to mongoDB successfully!')).catch(err=>console.log('error connecting to DB!',err))



// const newTour = new Tour({
//   name: 'lonavla',
//   price: 1500,
//   rating: 4.7
// })

// newTour.save().then(()=> console.log('saved tour successfully!')).catch(err=>console.log('Error saving tour💥',err))

process.on('unhandledRejection',(err)=>{
  console.log('UNHANDLE REJECTION 💥', err)
  // app.stop(()=>{
  //   process.exit(1);
  // })
})

app.listen(process.env.PORT, () => {
  console.log(`Server listening on ${process.env.PORT}`);
});


