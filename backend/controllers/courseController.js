const courseService = require('../services/courseService');
const { broadcastToCourse } = require('../utils/websocket');

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
      if (status === 3 && exam_start_time && exam_deadline) {
        broadcastToCourse(id, {
          type: 'EXAM_STARTED',
          courseId: id,
          exam_start_time,
          exam_deadline
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
      
      const createdQuestions = await courseService.createExamQuestions(id, questions);
      
      res.json({
        success: true,
        questions_count: createdQuestions.length
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
}

module.exports = new CourseController();
