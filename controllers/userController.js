const User = require('../models/User');
const Course = require('../models/Course');

const getMyEnrolledCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const courseIds = user.enrolledCourses.map(enrollment => enrollment.course);
    const courses = await Course.find({ '_id': { $in: courseIds } });
    const enrolledCoursesWithDetails = user.enrolledCourses.map(enrollment => {
      const courseDetails = courses.find(
        c => c._id.toString() === enrollment.course.toString()
      );
      return {
        _id: enrollment._id,
        completedSections: enrollment.completedSections,
        course: courseDetails
      };
    }).filter(e => e.course);
    res.json(enrolledCoursesWithDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateCourseProgress = async (req, res) => {
  // Use sectionId here
  const { courseId, sectionId } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    const courseEnrollment = user.enrolledCourses.find(
      (c) => c.course.toString() === courseId
    );
    if (!courseEnrollment) {
      return res.status(404).json({ message: "Not enrolled" });
    }
    // Update the correct array
    if (!courseEnrollment.completedSections.includes(sectionId)) {
      courseEnrollment.completedSections.push(sectionId);
      await user.save();
    }
    res.status(200).json(courseEnrollment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
const getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'enrolledCourses',
      populate: { path: 'course', model: 'Course' }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const coursesInProgress = user.enrolledCourses.length;
    let coursesCompleted = 0;

    user.enrolledCourses.forEach(enrollment => {
      if (enrollment.course && enrollment.course.sections) {
        const totalSections = enrollment.course.sections.length;
        if (totalSections > 0 && enrollment.completedSections.length === totalSections) {
          coursesCompleted++;
        }
      }
    });

    res.json({
      coursesInProgress,
      coursesCompleted,
      certificatesEarned: coursesCompleted, // Assuming one certificate per completed course
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getMyEnrolledCourses, updateCourseProgress, getUserStats };