const express = require('express');
const userController = require('../controllers/userController');
const courseController = require('../controllers/courseController');
const enrollmentController = require('../controllers/enrollmentController');
const submissionController = require('../controllers/submissionController');
const resultController = require('../controllers/resultController');

const router = express.Router();

// ===== USER ROUTES =====
router.post('/users/register', userController.register);
router.get('/users/:address', userController.getProfile);
router.get('/users/:address/role', userController.getRole);
router.patch('/users/:address', userController.updateProfile);

// ===== COURSE ROUTES =====
router.post('/courses', courseController.create);
router.get('/courses', courseController.getAll);
router.get('/courses/:id', courseController.getById);
router.patch('/courses/:id/status', courseController.updateStatus);

// Exam routes
router.post('/courses/:id/exam', courseController.createExam);
router.post('/courses/:id/start', courseController.startExam);
router.get('/exams/:courseId/questions', courseController.getExamQuestions);
router.get('/exams/:courseId/status', courseController.getExamStatus);

// ===== ENROLLMENT ROUTES =====
router.post('/courses/:course_id/enroll', enrollmentController.create);
router.get('/courses/:course_id/enrollments', enrollmentController.getByCourse);
router.get('/courses/:course_id/enrollment-check', enrollmentController.checkEnrollment);

// ===== SUBMISSION ROUTES =====
router.post('/courses/:course_id/submit', submissionController.create);
router.post('/courses/:course_id/auto-submit', submissionController.autoSubmit);
router.get('/courses/:course_id/submissions', submissionController.getByCourse);
router.get('/courses/:course_id/submission', submissionController.getByStudent);
router.get('/courses/:course_id/submission-check', submissionController.checkSubmission);

// ===== RESULT ROUTES =====
router.post('/courses/:course_id/results', resultController.create);
router.get('/courses/:course_id/results', resultController.getByCourse);
router.get('/courses/:course_id/my-rank', resultController.getStudentRank);
router.patch('/courses/:course_id/rewards', resultController.updateRewards);

module.exports = router;
