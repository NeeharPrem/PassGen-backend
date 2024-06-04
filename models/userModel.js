const mongoose = require('mongoose');

const storedPassSchema = new mongoose.Schema({
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
});

const userDataSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    storedpass: {
        type: [storedPassSchema],
        default: [],
    },
});

const User = mongoose.model('User', userDataSchema);

module.exports = User;