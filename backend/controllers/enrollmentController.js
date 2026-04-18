const enrollmentService = require('../services/enrollmentService');

class EnrollmentController {
  async create(req, res) {
    try {
      const { course_id } = req.params;
      const { student_address, amount_paid, tx_digest } = req.body;
      
      const enrollment = await enrollmentService.createEnrollment({
        course_id,
        student_address,
        amount_paid,
        tx_digest
      });
      
      res.json({
        success: true,
        enrollment
      });
    } catch (error) {
      console.error('Create enrollment error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getByCourse(req, res) {
    try {
      const { course_id } = req.params;
      
      const enrollments = await enrollmentService.getEnrollmentsByCourse(course_id);
      
      res.json(enrollments);
    } catch (error) {
      console.error('Get enrollments error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async checkEnrollment(req, res) {
    try {
      const { course_id } = req.params;
      const { student_address } = req.query;
      
      const isEnrolled = await enrollmentService.isStudentEnrolled(
        course_id,
        student_address
      );
      
      res.json({ isEnrolled });
    } catch (error) {
      console.error('Check enrollment error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new EnrollmentController();
