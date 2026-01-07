const nodemailer = require('nodemailer');

let transporter;

const createTransporter = async () => {
  if (transporter) return transporter;

  const testAccount = await nodemailer.createTestAccount();

  console.log('📧 Email Service Ready');
  console.log(`   Preview User: ${testAccount.user}`);

  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, 
    auth: {
      user: testAccount.user, 
      pass: testAccount.pass, 
    },
  });
  
  return transporter;
};

const getEmailContent = (status, customerName, ticketId, model) => {
  const subject = `Update on Ticket #${ticketId} - ${status}`;
  let text = `Hello ${customerName},\n\nThis is an update regarding your device (${model}).\n\nCurrent Status: ${status}\n\n`;

  switch (status) {
    case 'In Progress':
      text += "Our technicians have started working on your device.";
      break;
    case 'Waiting for Parts':
      text += "We are currently waiting for specific parts to arrive.";
      break;
    case 'Completed':
      text += "Great news! Your device has been repaired and is ready.";
      break;
    case 'Cancelled':
      text += "Your request has been cancelled.";
      break;
    default:
      text += "The status of your ticket has been updated.";
  }

  text += "\n\nBest regards,\nElectronics R&R Team";
  return { subject, text };
};

const sendStatusUpdateEmail = async (userEmail, userName, ticketId, model, newStatus) => {
  try {
    const emailTransporter = await createTransporter();
    const { subject, text } = getEmailContent(newStatus, userName, ticketId, model);

    const info = await emailTransporter.sendMail({
      from: '"Electronics R&R System" <system@electronics-rr.com>',
      to: userEmail,
      subject: subject,
      text: text,
    });

    console.log(`✅ Email sent for Ticket ${ticketId}`);
    console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
  }
};

module.exports = { sendStatusUpdateEmail };