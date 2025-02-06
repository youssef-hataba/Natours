const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Youssef Hataba <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Use SendGrid or another email provider in production
      return 1;
    } else {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
  }

  async send(templateName, subject) {
    // 1) Read the HTML template
    const templatePath = path.join(__dirname, '../views/emails', `${templateName}.html`);
    const templateSource = fs.readFileSync(templatePath, 'utf-8');

    // 2) Compile the template with Handlebars
    const compiledTemplate = handlebars.compile(templateSource);
    const html = compiledTemplate({
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // 3) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
    };

    // 4) Create transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcomeTemplate', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Password Reset');
  }
};


// const sendEmail =async (options) =>{
//   // 1) Create a transporter
//   const transporter = nodemailer.createTransport({
//     host:process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD
//     }
//   })
//   // 2) Define the options
//   const mailOptions ={
//     from:"youssef Hataba <youssefhataba1@gmail.com>",
//     to:options.email,
//     subject:options.subject,
//     text:options.message
//   }

//   //? 3) Actually send the email
//   await transporter.sendMail(mailOptions);

// }
