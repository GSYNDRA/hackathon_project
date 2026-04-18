const models = require('../models');

class ResultService {
  async createResults(courseId, results) {
    try {
      const createdResults = await Promise.all(
        results.map(r => 
          models.Result.create({
            course_id: courseId,
            student_address: r.student_address,
            score: r.score,
            percentage: r.percentage,
            correct_count: r.correct_count,
            total_questions: r.total_questions,
            time_taken_seconds: r.time_taken_seconds,
            rank_position: r.rank_position,
            scored_at: new Date()
          })
        )
      );
      
      return createdResults;
    } catch (error) {
      throw new Error(`Failed to create results: ${error.message}`);
    }
  }

  async updateRewards(courseId, rewards) {
    try {
      await Promise.all(
        rewards.map(r => 
          models.Result.update(
            {
              reward_amount: r.reward_amount,
              rewarded_at: r.rewarded_at
            },
            {
              where: {
                course_id: courseId,
                student_address: r.student_address
              }
            }
          )
        )
      );

      // Update course status to REWARDS_DISTRIBUTED (5)
      await models.Course.update(
        { status: 5 },
        { where: { id: courseId } }
      );

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to update rewards: ${error.message}`);
    }
  }

  async getResultsByCourse(courseId) {
    try {
      const results = await models.Result.findAll({
        where: { course_id: courseId },
        include: [
          {
            model: models.UserProfile,
            as: 'student',
            attributes: ['wallet_address', 'username']
          }
        ],
        order: [['rank_position', 'ASC']]
      });

      return results;
    } catch (error) {
      throw new Error(`Failed to get results: ${error.message}`);
    }
  }

  async getResultsByStudent(studentAddress) {
    try {
      const results = await models.Result.findAll({
        where: { student_address: studentAddress },
        include: [
          {
            model: models.Course,
            as: 'course'
          }
        ],
        order: [['scored_at', 'DESC']]
      });

      return results;
    } catch (error) {
      throw new Error(`Failed to get student results: ${error.message}`);
    }
  }

  async getStudentRank(courseId, studentAddress) {
    try {
      const result = await models.Result.findOne({
        where: {
          course_id: courseId,
          student_address: studentAddress
        },
        attributes: ['rank_position', 'score', 'percentage', 'reward_amount']
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to get student rank: ${error.message}`);
    }
  }
}

module.exports = new ResultService();
