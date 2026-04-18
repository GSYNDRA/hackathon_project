const models = require('../models');
const { broadcastToCourse, broadcastToAll } = require('../utils/websocket');

class EnrollmentService {
  async createEnrollment(data) {
    try {
      const enrollment = await models.Enrollment.create({
        course_id: data.course_id,
        student_address: data.student_address,
        amount_paid: data.amount_paid,
        on_chain_tx_digest: data.tx_digest,
      });

      // Mirror the on-chain status flip: ENROLLING -> READY_FOR_EXAM once min_students reached
      const course = await models.Course.findByPk(data.course_id);
      let newStatus = course?.status;
      if (course && course.status === 0) {
        const enrolledCount = await models.Enrollment.count({
          where: { course_id: data.course_id },
        });
        if (enrolledCount >= course.min_students) {
          await course.update({ status: 1 });
          newStatus = 1;
        }
      }

      const currentEnrolled = await models.Enrollment.count({
        where: { course_id: data.course_id },
      });
      broadcastToCourse(data.course_id, {
        type: 'STUDENT_ENROLLED',
        student_address: data.student_address,
        enrolled_count: currentEnrolled,
        status: newStatus,
      });
      broadcastToAll({
        type: 'COURSE_UPDATED',
        course_id: Number(data.course_id),
        status: newStatus,
        enrolled_count: currentEnrolled,
      });

      return enrollment;
    } catch (error) {
      throw new Error(`Failed to create enrollment: ${error.message}`);
    }
  }

  async getEnrollmentsByCourse(courseId) {
    try {
      const enrollments = await models.Enrollment.findAll({
        where: { course_id: courseId },
        include: [
          {
            model: models.UserProfile,
            as: 'student',
            attributes: ['wallet_address', 'username']
          }
        ],
        order: [['enrolled_at', 'ASC']]
      });

      return enrollments;
    } catch (error) {
      throw new Error(`Failed to get enrollments: ${error.message}`);
    }
  }

  async getEnrollmentsByStudent(studentAddress) {
    try {
      const enrollments = await models.Enrollment.findAll({
        where: { student_address: studentAddress },
        include: [
          {
            model: models.Course,
            as: 'course'
          }
        ],
        order: [['enrolled_at', 'DESC']]
      });

      return enrollments;
    } catch (error) {
      throw new Error(`Failed to get student enrollments: ${error.message}`);
    }
  }

  async isStudentEnrolled(courseId, studentAddress) {
    try {
      const enrollment = await models.Enrollment.findOne({
        where: {
          course_id: courseId,
          student_address: studentAddress
        }
      });

      return !!enrollment;
    } catch (error) {
      throw new Error(`Failed to check enrollment: ${error.message}`);
    }
  }
}

module.exports = new EnrollmentService();
