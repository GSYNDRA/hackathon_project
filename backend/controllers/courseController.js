const { keccak_256 } = require('js-sha3');
const models = require('../models');
const courseService = require('../services/courseService');
const { broadcastToCourse, broadcastToAll } = require('../utils/websocket');

function keccak256Buffer(bytes) {
  return Buffer.from(keccak_256.arrayBuffer(bytes));
}

class CourseController {
  async create(req, res) {
    try {
      const {
        on_chain_id,
        teacher_address,
        name,
        description,
        category,
        thumbnail_url,
        tuition_amount,
        max_students,
        min_students
      } = req.body;
      
      if (!on_chain_id || !teacher_address || !name || !tuition_amount) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const course = await courseService.createCourse({
        on_chain_id,
        teacher_address,
        name,
        description,
        category,
        thumbnail_url,
        tuition_amount,
        max_students,
        min_students
      });

      broadcastToAll({ type: 'COURSE_CREATED', course_id: course.id });

      res.json({
        success: true,
        course
      });
    } catch (error) {
      console.error('Create course error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const { status, teacher } = req.query;
      
      const courses = await courseService.getAllCourses({ status, teacher });
      
      res.json(courses);
    } catch (error) {
      console.error('Get courses error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      
      const course = await courseService.getCourseById(id);
      
      res.json(course);
    } catch (error) {
      console.error('Get course error:', error);
      if (error.message === 'Course not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, exam_start_time, exam_deadline } = req.body;
      
      const course = await courseService.updateCourseStatus(
        id,
        status,
        { exam_start_time, exam_deadline }
      );
      
      // Broadcast to WebSocket subscribers if exam is starting
      if (status === 2 && exam_start_time && exam_deadline) {
        broadcastToCourse(id, {
          type: 'EXAM_STARTED',
          courseId: id,
          exam_start_time,
          exam_deadline,
        });
      }
      
      res.json({
        success: true,
        course
      });
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async createExam(req, res) {
    try {
      const { id } = req.params;
      const { questions } = req.body;
      
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: 'Questions array is required' });
      }
      
      const answerKey = questions.map(q => q.correct_answer_idx);
      const answerKeyBuffer = Buffer.from(answerKey);
      const answerHash = keccak256Buffer(answerKeyBuffer);

      const createdQuestions = await courseService.createExamQuestions(id, questions);
      
      res.json({
        success: true,
        questions_count: createdQuestions.length,
        answer_hash: Array.from(answerHash),
        answer_hash_hex: answerHash.toString('hex')
      });
    } catch (error) {
      console.error('Create exam error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getExamQuestions(req, res) {
    try {
      const { courseId } = req.params;
      const { studentAddress, includeAnswers } = req.query;
      
      // If requesting with answers, verify it's the teacher
      // For now, we require studentAddress to verify enrollment
      
      const questions = await courseService.getExamQuestions(
        courseId,
        includeAnswers === 'true'
      );
      
      res.json(questions);
    } catch (error) {
      console.error('Get exam questions error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getExamStatus(req, res) {
    try {
      const { courseId } = req.params;
      
      const course = await courseService.getCourseById(courseId);
      
      res.json({
        status: course.status,
        exam_start_time: course.exam_start_time,
        exam_deadline: course.exam_deadline
      });
    } catch (error) {
      console.error('Get exam status error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async startExam(req, res) {
    try {
      const { id } = req.params;
      const { exam_start_time, exam_deadline } = req.body;

      const course = await courseService.startExam(
        id,
        exam_start_time,
        exam_deadline
      );

      // Broadcast to all connected students
      broadcastToCourse(id, {
        type: 'EXAM_STARTED',
        courseId: id,
        exam_start_time,
        exam_deadline
      });

      res.json({
        success: true,
        course
      });
    } catch (error) {
      console.error('Start exam error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Prepare phase: return the answer key + counts without mutating anything.
   * The teacher frontend calls this first, then runs on-chain reveal_and_score,
   * and only after chain success calls scoreExamCommit below.
   */
  async scoreExamPrepare(req, res) {
    try {
      const { id } = req.params;
      const course = await models.Course.findByPk(id);
      if (!course) return res.status(404).json({ error: 'Course not found' });

      const questions = await models.ExamQuestion.findAll({
        where: { course_id: id },
        order: [['question_number', 'ASC']],
      });
      if (!questions.length) {
        return res.status(400).json({ error: 'No exam questions for this course' });
      }

      const answerKey = questions.map((q) => q.correct_answer_idx);
      const answerHash = keccak256Buffer(Buffer.from(answerKey));
      const enrolledCount = await models.Enrollment.count({ where: { course_id: id } });
      const submittedCount = await models.Submission.count({ where: { course_id: id } });

      res.json({
        answer_key: answerKey,
        answer_hash: Array.from(answerHash),
        answer_hash_hex: answerHash.toString('hex'),
        enrolled_count: enrolledCount,
        submitted_count: submittedCount,
        no_show_count: Math.max(0, enrolledCount - submittedCount),
      });
    } catch (error) {
      console.error('Score prepare error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Commit phase: run after chain reveal_and_score has succeeded.
   * Auto-submits no-shows (for the DB leaderboard), scores every submission,
   * persists ranked results, and flips status to SCORED (3). Idempotent — if
   * the course is already SCORED we return the existing result set untouched.
   */
  async scoreExamCommit(req, res) {
    try {
      const { id } = req.params;

      const course = await models.Course.findByPk(id);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      if (course.status >= 3) {
        const existing = await models.Result.count({ where: { course_id: id } });
        return res.json({
          success: true,
          already_scored: true,
          scored_count: existing,
        });
      }

      const enrollments = await models.Enrollment.findAll({ where: { course_id: id } });
      const existingSubmissions = await models.Submission.findAll({ where: { course_id: id } });
      const submittedAddresses = new Set(existingSubmissions.map(s => s.student_address));
      const questions = await models.ExamQuestion.findAll({
        where: { course_id: id },
        order: [['question_number', 'ASC']],
      });

      const examDeadline = course.exam_deadline ? new Date(course.exam_deadline) : new Date();

      for (const enrollment of enrollments) {
        if (!submittedAddresses.has(enrollment.student_address)) {
          const emptyAnswers = questions.map(() => 255);
          await models.Submission.create({
            course_id: id,
            student_address: enrollment.student_address,
            answers: emptyAnswers,
            answers_hash: 'auto_submit_no_show',
            submitted_at: examDeadline,
            is_auto_submit: true,
            on_chain_tx_digest: null,
          });
        }
      }

      const answerKey = questions.map(q => q.correct_answer_idx);
      const totalQuestions = answerKey.length;
      const answerHash = keccak256Buffer(Buffer.from(answerKey));

      const allSubmissions = await models.Submission.findAll({ where: { course_id: id } });
      const examStartMs = course.exam_start_time ? new Date(course.exam_start_time).getTime() : null;

      const scored = allSubmissions.map((s) => {
        const answers = Array.isArray(s.answers) ? s.answers : [];
        let correct = 0;
        for (let i = 0; i < totalQuestions; i++) {
          if (answers[i] === answerKey[i]) correct++;
        }
        const percentage = totalQuestions > 0 ? Math.floor((correct * 100) / totalQuestions) : 0;
        let timeTakenSeconds = s.time_taken_seconds;
        if (timeTakenSeconds == null) {
          if (examStartMs && s.submitted_at) {
            timeTakenSeconds = Math.max(0, Math.floor((new Date(s.submitted_at).getTime() - examStartMs) / 1000));
          } else {
            timeTakenSeconds = 0;
          }
        }
        return {
          student_address: s.student_address,
          score: correct,
          percentage,
          correct_count: correct,
          total_questions: totalQuestions,
          time_taken_seconds: timeTakenSeconds,
        };
      });

      scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.time_taken_seconds - b.time_taken_seconds;
      });

      const now = new Date();
      await models.Result.destroy({ where: { course_id: id } });
      for (let i = 0; i < scored.length; i++) {
        const r = scored[i];
        await models.Result.create({
          course_id: id,
          student_address: r.student_address,
          score: r.score,
          percentage: r.percentage,
          correct_count: r.correct_count,
          total_questions: r.total_questions,
          time_taken_seconds: r.time_taken_seconds,
          rank_position: i + 1,
          reward_amount: 0,
          scored_at: now,
        });
      }

      await course.update({ status: 3 });

      broadcastToCourse(id, {
        type: 'EXAM_SCORED',
        total_submissions: allSubmissions.length,
        scored_count: scored.length,
      });
      broadcastToAll({ type: 'COURSE_UPDATED', course_id: Number(id), status: 3 });

      res.json({
        success: true,
        answer_key: answerKey,
        answer_hash: Array.from(answerHash),
        answer_hash_hex: answerHash.toString('hex'),
        total_submissions: allSubmissions.length,
        no_show_count: enrollments.length - existingSubmissions.length,
        scored_count: scored.length,
      });
    } catch (error) {
      console.error('Score exam error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new CourseController();
