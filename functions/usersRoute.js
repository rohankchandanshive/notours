const express = require('express');
const UsersController = require('../controller/usersController');
const {signUp, login, authenticate, forgotPassword,resetPassword, updatePassword, authorize} = require('../controller/authController');
const user = require('../model/user');

const usersRouter = express.Router();
usersRouter.post('/signUp',signUp);
usersRouter.post('/login',login);
usersRouter.post('/forgotPassword',forgotPassword);
usersRouter.patch('/resetPassword/:token',resetPassword);
usersRouter.patch('/updatePassword',authenticate,updatePassword);
usersRouter.patch('/updateMe',authenticate,UsersController.userPhotoUpload,UsersController.resizePhoto,UsersController.updateMe);
usersRouter.patch('/deleteMe',authenticate,UsersController.deleteMe);




usersRouter.route('/').get(authenticate,UsersController.getUsers).post(UsersController.createUser);
usersRouter.route('/:id').get(authenticate,UsersController.getUser).patch(authenticate,UsersController.updateUser).delete(authenticate,authorize('admin'), UsersController.deleteUser);

module.exports = usersRouter;