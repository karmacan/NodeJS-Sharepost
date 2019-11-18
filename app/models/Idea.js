const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema
const IdeaSchema = new Schema({
    title: {type: String, required: true},
    details: {type: String, required: true},
    date: {type: Date, default: Date.now, required: true},

    user: {type: String, required: true} /* ACCESS CONTROL */

});

// Model
const modelName = 'Idea'; // name by which model calls from app.js
mongoose.model(modelName, IdeaSchema); // model creator from app.js