require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const mongoURI = process.env.MONGODB_URI;
const userModel= require('./models/userModel')
const jwt = require('jsonwebtoken')
const secretKey= process.env.JWT
const cors= require('cors')

const app = express();
const port = process.env.PORT

app.use(cors({
    origin: '*',
    credentials: true
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


mongoose.connect(mongoURI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('Error during connecting to MongoDB', err);
    });


    app.post('/signup', async (req, res) => {
        const { email, password, cpassword } = req.body;
        if (!email || !password || !cpassword) {
            return res.status(401).json({ message: 'Fill required fields' });
        }
    
        if (password === cpassword) {
            try {
                const newUser = new userModel({
                    email: email,
                    password: password
                });
    
                await newUser.save();
                return res.status(201).json({ message: 'User created successfully',state:true});
            } catch (error) {
                console.error('Error saving new user:', error);
                return res.status(500).json({ message: 'Internal server error' });
            }
        } else {
            return res.status(401).json({ message: 'Passwords do not match' });
        }
    });

app.post('/login', async (req, res) => {
    const { email, password,id} = req.body;

    if (!email || !password) {
        return res.status(401).json({ message: 'Fill required fields' });
    }

    try {
        const user = await userModel.findOne({ id });
        console.log(user)
        if (!user) {
            return res.status(400).json({ message: 'No user found' });
        }

        const isMatch = password === user.password;
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.status(200).json({ message: 'Login success', state: true, userData: user._id });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/savepass', async (req, res) => {
    const { name, password, userId } = req.body;
    if (!name || !password) {
        return res.status(401).json({ message: 'Fill required fields' });
    }
    try {
        if (!userId) {
            return res.status(401).json({ message: 'Authentication token not found' });
        }
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const existingPass = user.storedpass.find(pass => pass.name === name);
        if (existingPass) {
            return res.status(409).json({ message: 'Name already exists, please choose a different name' });
        }

        user.storedpass.push({ name, password });
        await user.save();

        res.status(200).json({ message: 'Password saved successfully',state:true});
    } catch (error) {
        console.error('Error during saving:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

    app.post('/getsaved', async (req, res) => {
        try {
            const {userId}= req.body
            if (!userId) {
                return res.status(401).json({ message: 'Authentication token not found' });
            }
            const user = await userModel.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            const savedPasswords = user.storedpass;
            res.status(200).json({ savedPasswords,state:true});
        } catch (error) {
            console.error('Error during getting data:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });

app.post('/deletepass', async (req, res) => {
    const { userId, index } = req.body;
    if (!userId || index === undefined) {
        return res.status(401).json({ message: 'Fill required fields' });
    }
    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (index < 0 || index >= user.storedpass.length) {
            return res.status(400).json({ message: 'Invalid index' });
        }

        user.storedpass.splice(index, 1);
        await user.save();

        res.status(200).json({ message: 'Password deleted successfully', state: true });
    } catch (error) {
        console.error('Error during deleting password:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
    
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});