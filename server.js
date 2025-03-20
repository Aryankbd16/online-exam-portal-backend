const express = require("express");
const connectDB = require("./models/db");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const bcrypt = require("bcryptjs"); // Ensure bcryptjs is used
const Student = require("./models/student");
const authRoutes = require("./models/login"); // Ensure the correct path to your login routes

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware (LOAD BEFORE ROUTES)
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up multer for file storage (handling images)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Home Route (Check if server is running)
app.get("/", (req, res) => {
    res.send("Server is running...");
});

// ✅ FIXED Signup Route (Now ensures all fields are saved)
app.post("/signup", upload.single("image"), async (req, res) => {
    try {
        console.log("Received Signup Request:", req.body);

        const { fullName, enrollmentNo, username, password, department, gender } = req.body;
        const image = req.file ? req.file.buffer.toString("base64") : null;

        if (!fullName || !enrollmentNo || !username || !password || !department || !gender || !image) {
            return res.status(400).json({ message: "All fields including image are required!" });
        }

        // Check if username or enrollment number already exists
        const existingUser = await Student.findOne({ $or: [{ username }, { enrollmentNo }] });
        if (existingUser) {
            return res.status(400).json({ message: "Username or Enrollment No already exists" });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newStudent = new Student({
            fullName,
            enrollmentNo,
            username,
            password: hashedPassword,
            department,
            gender,
            image,
            givenExams: [],
            notGivenExams: ["Python", "Microprocessor", "Database Management System", "Operating System"], // ✅ Ensure default exams are added
        });

        await newStudent.save();
        console.log("Student Data Saved Successfully!");
        res.status(201).json({ message: "Student registered successfully!" });

    } catch (error) {
        console.error("Error registering student:", error);
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

// Use Login Routes
app.use(authRoutes);

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
