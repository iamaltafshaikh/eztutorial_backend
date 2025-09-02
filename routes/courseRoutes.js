const express = require('express');
const router = express.Router();
const { 
  getCourses, 
  createCourse, 
  getCourseById, 
  updateCourse, 
  deleteCourse, 
  enrollInCourse, 
  getMyCourses, 
  getComments, 
  addComment,
  getEnrolledStudents, 
  removeStudentFromCourse, 
  deleteComment,
  getFeaturedCourse,
  featureCourse
} = require('../controllers/courseController');
const { protect, isTeacher } = require('../middleware/authMiddleware');

// General routes
router.route('/').get(getCourses).post(protect, isTeacher, createCourse);

// Specific text-based routes BEFORE generic '/:id' routes
router.route('/mycourses').get(protect, isTeacher, getMyCourses);
router.get('/featured', getFeaturedCourse);

// Routes with a specific course ID
router.route('/:id/comments').get(getComments).post(protect, addComment);
router.route('/:id/students').get(protect, isTeacher, getEnrolledStudents);
router.route('/:id/students/:studentId').delete(protect, isTeacher, removeStudentFromCourse);
router.route('/:id/comments/:commentId').delete(protect, isTeacher, deleteComment);
router.route('/:id/feature').put(protect, isTeacher, featureCourse);
router.route('/:id/enroll').post(protect, enrollInCourse);

// Generic GET/PUT/DELETE for a specific course ID must be last
router.route('/:id').get(getCourseById).put(protect, isTeacher, updateCourse).delete(protect, isTeacher, deleteCourse);

module.exports = router;