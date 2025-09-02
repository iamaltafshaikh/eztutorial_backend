const express = require('express');
const router = express.Router();
const { getMyEnrolledCourses, updateCourseProgress, getUserStats } = require('../controllers/userController'); // <-- IMPORT
const { protect } = require('../middleware/authMiddleware');

router.get('/my-courses', protect, getMyEnrolledCourses);
router.post('/my-courses/progress', protect, updateCourseProgress);
router.get('/stats', protect, getUserStats); // <-- ADD THIS ROUTE

module.exports = router;