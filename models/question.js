var mongoose = require("mongoose");

var questionSchema = new mongoose.Schema({
    questions: String,
    answers: [{
        letter: String,
        textOption: String
    }],
    correct: String      //one letter corresponding to right answer
});

module.exports = mongoose.model("Question", questionSchema);