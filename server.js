const bcrypt = require('bcryptjs');
const User = require('./models/User');

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB Atlas successfully!'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));

// --------------USER--------------//
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role
        });

        await newUser.save();
        res.status(201).json({ message: 'User created successfully!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// --------------Login--------------//
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.status(200).json({
            message: 'Login successful!',
            user: {
                firstName: user.firstName,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// --------------listen--------------//
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});