const models = require('../models');

class SubmissionService {
  async createSubmission(data) {
    try {
      const submission = await models.Submission.create({
        course_id: data.course_id,
        student_address: data.student_address,
        answers: data.answers,
        answers_hash: data.answers_hash,
        submitted_at: data.submitted_at,
        time_taken_seconds: data.time_taken_seconds,
        is_auto_submit: data.is_auto_submit || false,
        on_chain_tx_digest: data.tx_digest
      });
      
      return submission;
    } catch (error) {
      throw new Error(`Failed to create submission: ${error.message}`);
    }
  }

  async autoSubmit(courseId, studentAddress, submittedAt) {
    try {
      // Check if already submitted
      const existing = await models.Submission.findOne({
        where: {
          course_id: courseId,
          student_address: studentAddress
        }
      });

      if (existing) {
        return { message: 'Already submitted', submission: existing };
      }

      // Create auto-submission with empty answers
      const submission = await models.Submission.create({
        course_id: courseId,
        student_address: studentAddress,
        answers: [],
        answers_hash: '',
        submitted_at: submittedAt,
        is_auto_submit: true
      });

      return submission;
    } catch (error) {
      throw new Error(`Failed to auto-submit: ${error.message}`);
    }
  }

  async getSubmissionsByCourse(courseId) {
    try {
      const submissions = await models.Submission.findAll({
        where: { course_id: courseId },
        include: [
          {
            model: models.UserProfile,
            as: 'student',
            attributes: ['wallet_address', 'username']
          }
        ],
        order: [['submitted_at', 'ASC']]
      });

      return submissions;
    } catch (error) {
      throw new Error(`Failed to get submissions: ${error.message}`);
    }
  }

  async getSubmissionByStudent(courseId, studentAddress) {
    try {
      const submission = await models.Submission.findOne({
        where: {
          course_id: courseId,
          student_address: studentAddress
        }
      });

      return submission;
    } catch (error) {
      throw new Error(`Failed to get submission: ${error.message}`);
    }
  }

  async hasStudentSubmitted(courseId, studentAddress) {
    try {
      const submission = await models.Submission.findOne({
        where: {
          course_id: courseId,
          student_address: studentAddress
        }
      });

      return !!submission;
    } catch (error) {
      throw new Error(`Failed to check submission: ${error.message}`);
    }
  }
}

module.exports = new SubmissionService();
