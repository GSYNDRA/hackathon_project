const express = require('express');
const userController = require('../controllers/userController');
const courseController = require('../controllers/courseController');
const enrollmentController = require('../controllers/enrollmentController');
const submissionController = require('../controllers/submissionController');
const resultController = require('../controllers/resultController');
const aiController = require('../controllers/aiController');
const { requireTeacher, requireStudent } = require('../middleware/roleGuard');

const router = express.Router();

// ===== USER ROUTES =====
router.post('/users/register', userController.register);
router.get('/users/:address', userController.getProfile);
router.get('/users/:address/role', userController.getRole);
router.get('/users/:address/on-chain-role', userController.getOnChainRole);
router.patch('/users/:address', userController.updateProfile);

// ===== COURSE ROUTES (Teacher-only) =====
router.post('/courses', requireTeacher, courseController.create);
router.get('/courses', courseController.getAll);
router.get('/courses/:id', courseController.getById);
router.patch('/courses/:id/status', courseController.updateStatus);

// ===== EXAM ROUTES (Teacher-only) =====
router.post('/courses/:id/exam', requireTeacher, courseController.createExam);
router.post('/courses/:id/start', requireTeacher, courseController.startExam);
router.post('/courses/:id/score/prepare', requireTeacher, courseController.scoreExamPrepare);
router.post('/courses/:id/score/commit', requireTeacher, courseController.scoreExamCommit);
// Legacy all-in-one (kept for scripts / curl repair); does auto-submit + score + status flip.
router.post('/courses/:id/score', requireTeacher, courseController.scoreExamCommit);
router.get('/exams/:courseId/questions', courseController.getExamQuestions);
router.get('/exams/:courseId/status', courseController.getExamStatus);

// ===== ENROLLMENT ROUTES (Student-only) =====
router.post('/courses/:course_id/enroll', requireStudent, enrollmentController.create);
router.get('/courses/:course_id/enrollments', enrollmentController.getByCourse);
router.get('/courses/:course_id/enrollment-check', enrollmentController.checkEnrollment);

// ===== SUBMISSION ROUTES (Student-only) =====
router.post('/courses/:course_id/submit', requireStudent, submissionController.create);
router.post('/courses/:course_id/auto-submit', submissionController.autoSubmit);
router.get('/courses/:course_id/submissions', submissionController.getByCourse);
router.get('/courses/:course_id/submission', submissionController.getByStudent);
router.get('/courses/:course_id/submission-check', submissionController.checkSubmission);

// ===== RESULT ROUTES =====
router.post('/courses/:course_id/results', resultController.create);
router.get('/courses/:course_id/results', resultController.getByCourse);
router.get('/courses/:course_id/my-rank', resultController.getStudentRank);
router.patch('/courses/:course_id/rewards', resultController.updateRewards);

// ===== AI ROUTES =====
router.post('/ai/generate-questions', requireTeacher, aiController.generateQuestions);

module.exports = router;