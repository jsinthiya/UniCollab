var nodemailer = require('nodemailer');



async function sendMail(receiver,subject,body)
{
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "airamtafir@gmail.com",
          pass: process.env.GMAIL_PASSWORD,
        },
      });
    
    var mailOptions = {
      from: {
        name: 'UniConnect',
        address: 'airamtafir@gmail.com'
    },
      to: receiver,
      subject: subject,
      html: body
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
}

module.exports = {
    sendMail,
}