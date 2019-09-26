const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = ({ email, name }) => {
  sgMail.send({
    to: email,
    from: 'saharbec3@gmail.com',
    subject: 'Thanks for joining in!',
    text: `Welcome to the app, ${name}. let me know how you get along with the app`
  })
}

const sendCancelationEmail = ({ email, name }) => {
  sgMail.send({
    to: email,
    from: 'saharbec3@gmail.com',
    subject: 'Sad to see you leaving...',
    text: `Hey there ${name}, we are very dissapointed that you decided to cancel your account.
    Can you tell us please if there was something that we could have done better to keep you with us?`
  })
}

module.exports = {
  sendWelcomeEmail,
  sendCancelationEmail
}