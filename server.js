const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const app = express();

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/healix', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// User Schema
const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    password: String,
    phoneNumber: String,
    company: String,
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(express.static(path.join(__dirname)));

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/home.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

// Signup endpoint
app.post('/api/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password, phoneNumber, company } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phoneNumber,
            company
        });

        await user.save();
        res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id },
            'your_jwt_secret',  // Replace with secure secret key
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the website at: http://localhost:${PORT}`);
});