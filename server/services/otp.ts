export function generateOtp(): string {
  // Fixed OTP for testing purposes
  return "263457";
}

export async function sendOtp(phone: string, otp: string): Promise<void> {
  // In production, use a service like Twilio
  // For now, just log the OTP
  console.log(`Sending OTP ${otp} to phone ${phone}`);
  
  // Example Twilio integration:
  // const accountSid = process.env.TWILIO_ACCOUNT_SID;
  // const authToken = process.env.TWILIO_AUTH_TOKEN;
  // const client = require('twilio')(accountSid, authToken);
  // 
  // await client.messages.create({
  //   body: `Your OTP is: ${otp}`,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: phone
  // });
}

export async function sendEmailOtp(email: string, otp: string): Promise<void> {
  // In production, use a service like SendGrid or Nodemailer
  console.log(`Sending OTP ${otp} to email ${email}`);
  
  // Example Nodemailer integration:
  // const nodemailer = require('nodemailer');
  // const transporter = nodemailer.createTransporter({
  //   // your email config
  // });
  // 
  // await transporter.sendMail({
  //   from: process.env.FROM_EMAIL,
  //   to: email,
  //   subject: 'Your OTP Code',
  //   text: `Your OTP is: ${otp}`
  // });
}
