var mongoose = require("mongoose");

var contactSchema = new mongoose.Schema({
    title: String,
    email: String,
    text: String,
    author: {
        username: String,
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User" 
        }
    }
});

module.exports = mongoose.model("Contact", contactSchema);