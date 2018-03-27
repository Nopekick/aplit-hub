const nodemailer = require('nodemailer');
 
let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: 'nodepractice484@gmail.com',    //throwaway email, 
        pass: 'theyarnuser45 '     //deleted for security
    }
});
 
exports.sendOne = ({title, author, content, recipient, type}) => {
  let mailOptions = {
    from: 'nodepractice484@gmail.com',
    to: recipient,
    subject: 'New '+type+": "+title,
    text: `${title} by ${author} \n  ${content}`
  }
  //return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      //err ? reject(err) : resolve(info);
      if (err) console.log(err);
    });
}

exports.sendReply = ({title, content, recipient}) => {
  let mailOptions = {
    from: 'nodepractice484@gmail.com',
    to: recipient,
    subject: title,
    text: `${content}`
  }
  //return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      //err ? reject(err) : resolve(info);
      if (err) console.log(err);
    });
}