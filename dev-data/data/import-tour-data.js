const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fs = require('fs');
const Tour = require('../../model/tour');
const User = require('../../model/user');
const Review = require('../../model/review');

dotenv.config({ path: './local.env' });
const connStr = process.env.DB_CONNECTION_STRING.replace(
  '<db_username>',
  process.env.DB_USERNAME,
)
  .replace('<db_password>', process.env.DB_PASSWORD)
  .replace('<db_name>', process.env.DB_NAME);
mongoose
  .connect(connStr, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to mongoDB successfully!'))
  .catch((err) => console.log('error connecting to DB!', err));

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf8'));

const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf8'),
);

const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);

    console.log('Tours imported Successfully👍');
    process.exit();
  } catch (err) {
    console.log('Error importing tours💥', err);
    process.exit();
  }
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();

    console.log('Tours deleted Successfully👍');
    process.exit();
  } catch (err) {
    console.log('Error deleting tours💥', err);
    process.exit();
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
