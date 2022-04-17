import mongoose from "mongoose"

export const userSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    privateKey: String,
    address: String,
    username: String,
    password: String,
    created: {
        type: Date,
        default: Date.now
    }
});

export const User = mongoose.model('User', userSchema)
