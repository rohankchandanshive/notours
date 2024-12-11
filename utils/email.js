const nodemailer = require('nodemailer');
const pug=require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email{
    constructor(user,url){
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.to = `Rohan Chandanshive <${process.env.EMAIL_FROM}>`
    }

    newTransport(){
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD}
        })
    }

    async send(template, subject){
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`,{
            firstName: this.firstName,
            url: this.url,
            subject
        });
        const emailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html)
        }
        await this.newTransport().sendMail(emailOptions)
    }

    async sendWelcome(){
        await this.send('welcome','Hello welcome to the notours!');
    }

    async forgotPasswordSend(){
        await this.send('passwordReset','Forgot Password reset token is valid for 10 mins only!')
    }

    
}

// const sendEmail = async(options) => {
//     // 1. Create transport to which service we want to send email
//     const transporter = nodemailer.createTransport({
//         host: process.env.EMAIL_HOST,
//         port: process.env.EMAIL_PORT,
//         auth: {user: process.env.EMAIL_USERNAME,
//         pass: process.env.EMAIL_PASSWORD}
//     })

//     //2. Create options to pass to email
//     const emailOptions = {
//         from: 'Rohan Chandanshive <rohan@gmail.com>',
//         to: options.to,
//         subject: options.subject,
//         text: options.message 
//     }
//     console.log('sending email >>>>>', options);
//     // 3. Send email
//     await transporter.sendMail(emailOptions);
// }

// module.exports = { sendEmail };