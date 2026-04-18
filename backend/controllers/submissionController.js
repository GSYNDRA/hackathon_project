const submissionService = require('../services/submissionService');

class SubmissionController {
  async create(req, res) {
    try {
      const { course_id } = req.params;
      const {
        student_address,
        answers,
        answers_hash,
        submitted_at,
        time_taken_seconds,
        is_auto_submit,
        tx_digest
      } = req.body;
      
      const submission = await submissionService.createSubmission({
        course_id,
        student_address,
        answers,
        answers_hash,
        submitted_at,
        time_taken_seconds,
        is_auto_submit,
        tx_digest
      });
      
      res.json({
        success: true,
        submission
      });
    } catch (error) {
      console.error('Create submission error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async autoSubmit(req, res) {
    try {
      const { course_id } = req.params;
      const { student_address, submitted_at } = req.body;
      
      const submission = await submissionService.autoSubmit(
        course_id,
        student_address,
        submitted_at
      );
      
      res.json({
        success: true,
        submission
      });
    } catch (error) {
      console.error('Auto-submit error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getByCourse(req, res) {
    try {
      const { course_id } = req.params;
      
      const submissions = await submissionService.getSubmissionsByCourse(course_id);
      
      res.json(submissions);
    } catch (error) {
      console.error('Get submissions error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getByStudent(req, res) {
    try {
      const { course_id } = req.params;
      const { student_address } = req.query;
      
      const submission = await submissionService.getSubmissionByStudent(
        course_id,
        student_address
      );
      
      res.json(submission);
    } catch (error) {
      console.error('Get submission error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async checkSubmission(req, res) {
    try {
      const { course_id } = req.params;
      const { student_address } = req.query;
      
      const hasSubmitted = await submissionService.hasStudentSubmitted(
        course_id,
        student_address
      );
      
      res.json({ hasSubmitted });
    } catch (error) {
      console.error('Check submission error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new SubmissionController();
