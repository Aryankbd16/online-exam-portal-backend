const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    enrollmentNo: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    department: { type: String, required: true },
    gender: { type: String, required: true },
    image: { type: String }, // Store image as Base64 string
    givenExams: { type: [String], default: [] }, // Stores completed exams
    notGivenExams: { type: [String], default: ["Python", "Microprocessor", "Database Management System", "Operating System"] } // Default subjects
});

module.exports = mongoose.model("Student", studentSchema);