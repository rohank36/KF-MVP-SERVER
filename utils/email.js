const nodemailer = require("nodemailer");

/*
const sendEmail = async (options) => {
  //1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  //2) Define the email options
  const mailOptions = {
    from: "Rohan Kanti <rohankanti2527@gmail.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  //3) Send email with NodeMailer
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
*/

module.exports = class Email {
  constructor(coachEmail, url, userFullName, message, subject) {
    this.to = coachEmail;
    this.userFullName = userFullName;
    this.url = url;
    this.from = `KaizenFlo <${process.env.EMAIL_FROM}>`;
    this.message = message;
    this.subject = subject;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // Sendgrid
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(subject, content) {
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text: content,
    };

    // Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendVideoToCoach() {
    await this.send(this.subject, this.message);
  }
};
