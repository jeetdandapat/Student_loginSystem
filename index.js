const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const bodyParser = require("body-parser"); // Body Parser ko import kar rahe hain
const session = require("express-session"); // Session management ke liye
const bcrypt = require("bcryptjs"); // Password hashing ke liye
const uuid = require("uuid"); // Unique ID generation ke liye
const XLSX = require('xlsx'); // For exporting to Excel
const fs = require('fs'); // For file system operations

const app = express();

// MySQL connection setup
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "college_management",
    password: "MySQL+dsa+java",
});

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true })); // URL-encoded data ko parse karna
app.use(bodyParser.json()); // JSON data ko parse karna

// Session setup
app.use(session({
    secret: "secretkey", // Session secret key, yeh change kar sakte hain
    resave: false,
    saveUninitialized: true
}));

// Set the view engine to EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/view"));
app.use(express.static(path.join(__dirname, "public")));



// Server listen
const port = 8180;
app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});

// Routes
// Home route (login page)
app.get("/", (req, res) => {
    res.render("login.ejs");
});

// Register route
app.get("/register", (req, res) => {
    res.render("register.ejs");
});

// Register POST route
app.post("/register", (req, res) => {
    const { username, email, phone, registration, password } = req.body;

    // Password hashing
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error hashing password.");
        }

        // User data insertion into MySQL
       
        const query = `INSERT INTO users (user_id, username, email, phone, registration_number, password) VALUES (?, ?, ?, ?, ?, ?)`;
        connection.query(query, [userId, username, email, phone, registration, hashedPassword], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Error registering user.");
            }

            // Fetching all users data from database
            const fetchUsersQuery = "SELECT * FROM users";
            connection.query(fetchUsersQuery, (err, usersData) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send("Error fetching users data.");
                }

                // Converting users data to Excel format
                const ws = XLSX.utils.json_to_sheet(usersData);  // Converting all users data
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Users');

                // Save the Excel file to the server
                const excelPath = path.join(__dirname, 'users_data.xlsx');
                XLSX.writeFile(wb, excelPath);

                // Redirect to login page after successful registration
                res.redirect("/");
            });
        });
    });
});

// Login POST route
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const query = `SELECT * FROM users WHERE username = ?`;
    connection.query(query, [username], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error logging in.");
        }

        if (result.length > 0) {
            // Compare entered password with stored hashed password
            bcrypt.compare(password, result[0].password, (err, isMatch) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send("Error comparing passwords.");
                }

                if (isMatch) {
                    // Store user in session if login is successful
                    req.session.user = result[0];
                    res.redirect("/dashboard");
                } else {
                    res.status(400).send("Incorrect password.");
                }
            });
        } else {
            res.status(400).send("User not found.");
        }
    });
});

// Dashboard route (after login)
app.get("/dashboard", (req, res) => {
    if (req.session.user) {
        res.send(`Welcome ${req.session.user.username}!`);
    } else {
        res.redirect("/");
    }
});
