const nodemailer = require("nodemailer");
require("dotenv").config(); // Ensure you load environment variables

// Configure transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "swarupgol.19@gmail.com", // Use environment variable
        pass: "dwnuvbvgkqrelnlp"  // Use environment variable
    },
});

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded" : "Not Loaded");


// Function to generate a 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit OTP
};

// Function to send OTP email
const sendOTPEmail = async (userEmail, otp) => {
    const mailOptions = {
        from: "swarupgol.19@gmail.com",
        to: userEmail,
        subject: "Your OTP Code",
        text: `Your One-Time Password (OTP) is: ${otp}. It is valid for 5 minutes. Do not share this code with anyone.`,
    };

    try {
        console.log("Attempting to send email to:", userEmail);
        console.log("Email Config:", mailOptions);

        const info = await transporter.sendMail(mailOptions);
        console.log("OTP email sent successfully:", info.response);
        return info.response;
    } catch (error) {
        console.error("Error sending OTP email:", error);
        return { error: error.message }; // Return error message
    }
};

async function sendCredentialsEmail(email, username, password) {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "swarupgol.19@gamil.com", // Your email
            pass: "dwnuvbvgkqrelnlp", // Your email password
        },
    });

    let mailOptions = {
        from:"swarupgol.19@gmail.com",
        to: email,
        subject: "Your Account Credentials",
        text: `Your Username: ${username}\nYour Password: ${password}`,
    };

    await transporter.sendMail(mailOptions);
}

module.exports = { generateOTP, sendOTPEmail ,sendCredentialsEmail };
