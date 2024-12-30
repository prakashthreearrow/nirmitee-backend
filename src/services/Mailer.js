var nodemailer = require("nodemailer");
var Email = require("email-templates");
const Helpers = require("./Helper");

module.exports = {
  sendMail: async (toEmail, mailSubject, templateName, locale) => {
    if (process.env.SEND_EMAIL === "true") {
      console.log({toEmail, mailSubject, templateName, locale});
      console.log( process.env.SMTP_HOST,process.env.SMTP_USER, process.env.SMTP_PASSWORD,process.env.COMPANY_EMAIL);
      try {
        const configOption = {
          service: process.env.SMTP_HOST,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
          tls: {
            ciphers: "SSLv3",
            rejectUnauthorized: false  // If necessary for self-signed certs (optional)
          },
        };
        const viewPath = "src/views/emails";
        const transporter = nodemailer.createTransport(configOption);
        const email = new Email({
          transport: transporter,
          send: true,
          preview: false,
          views: {
            options: {
              extension: "pug",
            },
            root: viewPath,
          },
        });
        // send mail with defined transport object
        const info = await email.send({
          template: templateName,
          message: {
            from: `${process.env.COMPANY_EMAIL}`,
            to: toEmail,
            subject: mailSubject,
          },
          locals: locale,
        });
        if (info) {
          console.log("Message sent: %s", info.messageId);
        }
        return info;
      } catch (error) {
        console.log(error, "mailer error");
        return null;
      }
    } else {
      return true;
    }
  },
};
