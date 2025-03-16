const express = require("express"); // ✅ Import Express
const bcrypt = require("bcryptjs"); 
const Student = require("./student");

const router = express.Router(); // ✅ Define router

// Login Route
router.post("/login", async (req, res) => {
    try {
        console.log("Received login request:", req.body);

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        const student = await Student.findOne({ username });

        if (!student) {
            console.log("User not found:", username);
            return res.status(401).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) {
            console.log("Incorrect password for:", username);
            return res.status(401).json({ message: "Incorrect password" });
        }

        console.log("Login successful for:", username);
        
        // ✅ Send the username in response so the frontend can store it
        res.status(200).json({
            message: "Login successful",
            username: student.username
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router; // ✅ Export router