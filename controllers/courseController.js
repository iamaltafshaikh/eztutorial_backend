const Course = require('../models/Course');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @desc    Fetch all courses
// @route   GET /api/courses
const getCourses = async (req, res) => {
  try {
    const keyword = req.query.search
      ? { $text: { $search: req.query.search } }
      : {};
    const courses = await Course.find({ ...keyword });
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Fetch single course by ID
// @route   GET /api/courses/:id
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (course) {
      res.json(course);
    } else {
      res.status(404).json({ message: 'Course not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new course
// @route   POST /api/courses
const createCourse = async (req, res) => {
  const { title, price, category, image, sections } = req.body;
  try {
    const course = new Course({
      title, price, category, image, sections,
      author: req.user.name,
      authorId: req.user._id,
    });
    const createdCourse = await course.save();
    res.status(201).json(createdCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a course
// @route   PUT /api/courses/:id
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    if (course.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'User not authorized' });
    }
    const { title, category, price, image, sections } = req.body;
    course.title = title || course.title;
    course.category = category || course.category;
    course.price = price || course.price;
    course.image = image || course.image;
    course.sections = sections || course.sections;
    const updatedCourse = await course.save();
    res.json(updatedCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a course
// @route   DELETE /api/courses/:id
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    if (course.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'User not authorized' });
    }
    await course.deleteOne();
    res.json({ message: 'Course removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Enroll a user in a course
// @route   POST /api/courses/:id/enroll
const enrollInCourse = async (req, res) => {
  const courseId = req.params.id;
  const studentId = req.user._id;
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    const student = await User.findById(studentId);
    const teacher = await User.findById(course.authorId);
    if (!student || !teacher) {
      return res.status(404).json({ message: 'User not found' });
    }
    const isEnrolled = student.enrolledCourses.some(
      (e) => e.course.toString() === courseId
    );
    if (isEnrolled) {
      return res.status(400).json({ message: 'Already enrolled' });
    }
    if (student.tokenBalance < course.price) {
      return res.status(400).json({ message: 'Insufficient token balance' });
    }
    student.tokenBalance -= course.price;
    teacher.tokenBalance += course.price;
    await Transaction.create({
      fromUser: studentId,
      toUser: teacher._id,
      course: courseId,
      amount: course.price,
    });
    student.enrolledCourses.push({ course: courseId, completedSections: [] });
    await student.save();
    await teacher.save();
    res.status(200).json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get courses created by a teacher
// @route   GET /api/courses/mycourses
const getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ authorId: req.user._id });
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get comments for a course
// @route   GET /api/courses/:id/comments
const getComments = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (course) {
      res.json(course.comments);
    } else {
      res.status(404).json({ message: 'Course not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add a comment to a course
// @route   POST /api/courses/:id/comments
const addComment = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const course = await Course.findById(req.params.id);
    const isEnrolled = user.enrolledCourses.some(
      (enrollment) => enrollment.course && enrollment.course.toString() === course._id.toString()
    );
    if (!isEnrolled) {
      return res.status(403).json({ message: 'User must be enrolled to comment' });
    }
    const newComment = {
      text: req.body.text,
      userName: req.user.name,
      user: req.user._id,
    };
    course.comments.unshift(newComment);
    await course.save();
    res.status(201).json(course.comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get students enrolled in a course
// @route   GET /api/courses/:id/students
const getEnrolledStudents = async (req, res) => {
  try {
    const courseId = req.params.id;
    const users = await User.find({ 'enrolledCourses.course': courseId });
    res.json(users.map(user => ({ _id: user._id, name: user.name, email: user.email })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Remove a student from a course
// @route   DELETE /api/courses/:id/students/:studentId
const removeStudentFromCourse = async (req, res) => {
  const { studentId } = req.params;
  const courseId = req.params.id;
  try {
    const user = await User.findById(studentId);
    if (user) {
      user.enrolledCourses = user.enrolledCourses.filter(
        (enrollment) => enrollment.course.toString() !== courseId
      );
      await user.save();
      res.json({ message: 'Student removed from course' });
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a comment from a course
// @route   DELETE /api/courses/:id/comments/:commentId
const deleteComment = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    if (course.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'User not authorized to delete comments' });
    }
    course.comments = course.comments.filter(
      (comment) => comment._id.toString() !== req.params.commentId
    );
    await course.save();
    res.json(course.comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get the featured course
// @route   GET /api/courses/featured
const getFeaturedCourse = async (req, res) => {
  try {
    const course = await Course.findOne({ isFeatured: true });
    if (course) {
      res.json(course);
    } else {
      res.status(404).json({ message: 'No featured course found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Set a course as featured
// @route   PUT /api/courses/:id/feature
const featureCourse = async (req, res) => {
  try {
    const courseToFeature = await Course.findById(req.params.id);

    if (!courseToFeature) {
      return res.status(404).json({ message: 'Course not found' });
    }
    if (courseToFeature.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'User not authorized' });
    }

    await Course.updateMany({ authorId: req.user._id }, { isFeatured: false });
    
    courseToFeature.isFeatured = true;
    await courseToFeature.save();

    res.json({ message: `Course "${courseToFeature.title}" is now featured.` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { 
  getCourses, getCourseById, createCourse, updateCourse, deleteCourse, 
  enrollInCourse, getMyCourses, getComments, addComment,
  getEnrolledStudents, removeStudentFromCourse, deleteComment,
  getFeaturedCourse, featureCourse
};