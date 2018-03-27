var mongoose = require("mongoose");

var poemSchema = new mongoose.Schema({
    title: String,
    author: String,
    text: String,
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});

module.exports = mongoose.model("Poem", poemSchema);