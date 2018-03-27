var mongoose = require("mongoose");

var forumPost = new mongoose.Schema({
    title: String,
    createdAt: { type: Date, default: Date.now },
    text: String,
    author: {
        username: String,
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User" 
        }
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});

module.exports = mongoose.model("ForumPost", forumPost);