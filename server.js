const express = require("express");
const connectDB = require("./models/db");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const Student = require("./models/student");
const authRoutes = require("./models/login");
const { sendOTPEmail,sendCredentialsEmail } = require("./models/mail");
const { generateOTP } = require("./models/mail");  // ✅ Import the mail function
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Multer setup for image uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Home route
app.get("/", (req, res) => {
    res.send("Server is running...");
});

// Route to Send OTP Email
app.post("/send-email", async (req, res) => {
    try {
        const { fullName, enrollmentNo, username, password, department, email, gender,image } = req.body;

        if (!fullName || !enrollmentNo || !username || !password || !department || !email || !gender) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        // Check if email already exists
        const existingUser = await Student.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered!" });
        }

        // Generate OTP and expiry time
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 5 * 60000); // Valid for 5 minutes

        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save user's details with OTP to the database
        const newStudent = new Student({
            fullName,
            enrollmentNo,
            username,
            password: hashedPassword,
            department,
            email,
            gender,
            otp,  // Save OTP in the database
            otpExpiry,  // Save OTP expiry time
            image
        });

        await newStudent.save();  // Save the student with OTP in the database

        // Send email with OTP
        await sendOTPEmail(email, otp);

        res.status(200).json({ message: "OTP sent successfully! Please verify to complete registration." });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ message: "Server error" });
    }
});


// Route to verify OTP
app.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required!" });
        }

        // Fetch student from the database
        const student = await Student.findOne({ email });

        if (!student) {
            return res.status(404).json({ message: "Student not found!" });
        }

        // Verify if the OTP is correct and if it has expired
        if (student.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP!" });
        }

        if (student.otpExpiry < Date.now()) {
            return res.status(400).json({ message: "OTP has expired!" });
        }

        // OTP is valid and not expired, clear OTP and expiry
        student.otp = null;
        student.otpExpiry = null;

        await student.save();

        // OTP verified successfully
        res.status(200).json({ message: "OTP verified successfully!" });

    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ message: "Server error" });
    }
});


app.post("/signup", upload.single("image"), async (req, res) => {
    try {
        const { email } = req.body;
        const image = req.file ? req.file.buffer.toString("base64") : null;

        if (!email || !image) {
            return res.status(400).json({ message: "Image and email are required!" });
        }

        // Find student by email
        const student = await Student.findOne({ email });
        if (!student) {
            return res.status(404).json({ message: "Student not found!" });
        }

        // Store the image in base64 format in the database
        student.image = image;

        // Save the student record
        await student.save();

        console.log("Student Registered Successfully!");
        res.status(201).json({ message: "Student registered successfully!" });

    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ FIXED `/getUser/:username` Route (Now retrieves full details)
app.get("/getUser/:username", async (req, res) => {
    try {
        const { username } = req.params;
        const user = await Student.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            fullName: user.fullName,
            enrollmentNo: user.enrollmentNo,
            username: user.username,
            department: user.department,
            image: user.image, // Image is included in case needed
            givenExams: user.givenExams,
            notGivenExams: user.notGivenExams
        });
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Route to check user existence and send credentials
app.post("/check-user", async (req, res) => {
    try {
        const { email, username, password } = req.body;

        if (!email || !username || !password) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        // Find user by email
        const user = await Student.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }

        // Check if username and password match
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (user.username !== username || !isPasswordValid) {
            return res.status(400).json({ message: "Invalid credentials!" });
        }

        // Send email with username and password
        await sendCredentialsEmail(email, username, password);

        res.status(200).json({ message: "Credentials sent successfully to your email!" });
    } catch (error) {
        console.error("Error checking user:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Exam Submission Route (No Changes Needed)
app.post("/submit-exam", async (req, res) => {
    try {
        const { username, examName } = req.body;

        // Find the user
        const student = await Student.findOne({ username });
        if (!student) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if exam is in notGivenExams and move it to givenExams
        if (student.notGivenExams.includes(examName)) {
            student.notGivenExams = student.notGivenExams.filter(exam => exam !== examName);
            student.givenExams.push(examName);
            await student.save();
            return res.status(200).json({ message: "Exam submitted successfully", student });
        } else {
            return res.status(400).json({ message: "Exam already submitted or not found in upcoming exams" });
        }
    } catch (error) {
        console.error("Error submitting exam:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Import authentication routes
app.use(authRoutes);

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
