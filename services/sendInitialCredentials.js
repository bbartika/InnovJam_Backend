import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
service: 'gmail',
auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
},
});


const sendInitialPasswordEmail = async (email, password) => {
const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: 'Welcome to INNOVJAM – Your Temporary Password is Here',
    html: `
     <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
         <h2 style="color: #2e6da4; text-align: center;">Welcome to HELIOS</h2>
        
         <p style="font-size: 16px; color: #333;">Hello,</p>
        
         <p style="font-size: 16px; color: #333;">
            Your temporary password is:
         </p>
        
         <div style="background-color: #f1f1f1; padding: 15px; text-align: center; border-radius: 5px; font-size: 20px; font-weight: bold; letter-spacing: 1px; color: #000;">
            ${password}
         </div>

         <p style="font-size: 16px; color: #333;">
            <strong>We strongly recommend resetting your password</strong> immediately after login for your account's security.
         </p>

         <p style="font-size: 14px; color: #999; border-top: 1px solid #eee; padding-top: 15px;">
            If you didn’t request this email, please ignore it or contact our support team.
         </p>

         <p style="text-align: center; font-size: 14px; color: #999;">— Team INNOVJAM</p>
        </div>
     </div>
    `,
};

try {
    await transporter.sendMail(mailOptions);
} catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send OTP email');
}
};

export default sendInitialPasswordEmail;