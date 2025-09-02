const mongoose = require('mongoose');

const SectionSchema = new mongoose.Schema({
  sectionId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  videoUrl: { type: String, required: true },
});

// --- NEW COMMENT SCHEMA ---
const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  text: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  author: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  sections: [SectionSchema], // <-- Major Change
  comments: [CommentSchema],
   isFeatured: { type: Boolean, default: false },
});

CourseSchema.index({ title: 'text', category: 'text' });

module.exports = mongoose.model('Course', CourseSchema);