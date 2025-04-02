const crypto = require("crypto");
const nodemailer = require("nodemailer");

const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString(); // Generate a 6-digit OTP
};

const sendOTPEmail = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: "gmail", // Use your email service
        auth: {
            user: process.env.EMAIL_USER, // Your email address
            pass: process.env.EMAIL_PASS, // Your email password
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "OTP for Signup",
        text: `Your OTP for signing up is: ${otp}. It will expire in 5 minutes.`,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending OTP email:", error);
        throw new Error("Failed to send OTP email");
    }
};

module.exports = { generateOTP, sendOTPEmail };
