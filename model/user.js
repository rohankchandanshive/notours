const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require("crypto")

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required!']
    },
    email: {
        type: String,
        required: [true, 'Email is required!'],
        unique: true,
        validate: [validator.isEmail,
        'Please provide a valid email!'],
    },
    role:{
        type: String,
        enum:['user','guide','lead-guide','admin'],
        required: [true,'Please provide a role!']
    },
    password: {
        type: String,
        required: [true, 'Password is required!'],
        // minlength: [8, 'Password must be at least 8 characters'],
        select: false,
    },
    confirmPassword: {
        type: String,
        required: [true,'Please confirm password!'],
        validate: {
            validator: function(){      // use normal function to access the current object through this keyword
                console.log('confirm pass validator',this.password, this.confirmPassword);
                return this.password === this.confirmPassword;
            },
            message: 'Passwords do not match'
        },
        select: false,

    },
    photo: {
        type: String,
        default: '',
        
        // required: [true, 'photo is required']
    },
    passwordResetCode: {type: String},
    passwordResetExpires: {type: Date},
    passwordChangedAt: Date,
    active:{
        type: Boolean,
        default: true,
        select: false
    }
})

userSchema.pre('save',async function(next){
    // Only run this if password is modified
    if(!this.isModified('password')) return next();

    //hasing password with intensity of 12
    this.password = await bcrypt.hash(this.password,12);
    this.confirmPassword = null;
    console.log('saving the password with encrypting>>>>>')
    next();
})

userSchema.pre('save', async function(next){
    console.log('isNew >>>>>>>>>>>', this.isNew,!this.isModified('password'));
    if(!this.isModified('password') || this.isNew) return next();
    console.log('adding passwordChangedAt')
    this.passwordChangedAt = Date.now() - 5000;
    next()
})

userSchema.methods.correctPassword = function(candidatePassword,password){  // USING method we can create methos on models 
    //taking passwords as param because we disabled the password field using select so it wont appear in this object as well
    return bcrypt.compare(candidatePassword, password);
}

userSchema.methods.isPasswordChanged = function(JWTTimestamp){  // USING method we can create methos on models 
    if(this.passwordChangedAt){
        const changedTimeStamp = this.passwordChangedAt.getTime()/1000;
        console.log('compare ',new Date(JWTTimestamp),new Date(changedTimeStamp))
        return JWTTimestamp < changedTimeStamp
    }
    return false;
}

userSchema.methods.generatePasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');
    const encryptedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    console.log({resetToken, encryptedResetToken})
    this.passwordResetCode = encryptedResetToken;   // save encrypted in DB share original token to email then in resetPassword will compare original with encrypted password
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000
    return resetToken;
}



userSchema.methods.validatePasswordResetToken = function(candidateResetToken, user){    //Logic to validate the reset token (Custom logic alternate way)
    // const resetToken = crypto.randomBytes(32).toString('hex');
    const encryptedResetToken = crypto.createHash('sha256').update(candidateResetToken).digest('hex');
    console.log('validate reset token',Date.now() , user.passwordResetExpires.getTime() ,Date.now() > user.passwordResetExpires.getTime());
    if(encryptedResetToken !== user.passwordResetCode){
        return {
            isValid: false,
            message: 'Provided token is not valid!'
        }
    } else if(Date.now() > user.passwordResetExpires.getTime()){
        return {
            isValid: false,
            message: 'Provided token is expired'
        }
    } else {
        return {
            isValid: true,
            message: 'Provided token is valid'
        }
    }
}


module.exports = mongoose.model('User',userSchema)