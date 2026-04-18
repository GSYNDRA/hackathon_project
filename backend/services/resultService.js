const models = require('../models');
const { broadcastToCourse, broadcastToAll } = require('../utils/websocket');

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

  async updateRewards(courseId) {
    try {
      const course = await models.Course.findByPk(courseId);
      if (!course) throw new Error('Course not found');

      // Pull DB rank rows in rank order.
      const allResults = await models.Result.findAll({
        where: { course_id: courseId },
        order: [['rank_position', 'ASC']],
      });

      // Chain's distribute_rewards only ranks students who called submit_answers on chain.
      // Auto-submitted no-shows get nothing on chain, so they must get nothing in the DB
      // mirror too — otherwise the UI promises a reward that was never paid.
      const submissions = await models.Submission.findAll({
        where: { course_id: courseId },
      });
      const onChainAddresses = new Set(
        submissions.filter((s) => !s.is_auto_submit).map((s) => s.student_address)
      );
      const onChainResults = allResults.filter((r) =>
        onChainAddresses.has(r.student_address)
      );

      const n = onChainResults.length;
      let winnerCount = Math.floor((n * 20) / 100);
      if (winnerCount === 0 && n > 0) winnerCount = 1;

      const tuition = BigInt(course.tuition_amount);
      const now = new Date();

      // Zero out every row first (idempotent & fixes past phantom rewards).
      for (const r of allResults) {
        await r.update({ reward_amount: 0, rewarded_at: null });
      }

      // Assign rewards to on-chain submitters in their rank order.
      for (let i = 0; i < n; i++) {
        const r = onChainResults[i];
        let reward = 0n;
        if (i < winnerCount) {
          reward = tuition / (1n << BigInt(i));
        }
        await r.update({
          reward_amount: reward.toString(),
          rewarded_at: i < winnerCount ? now : null,
        });
      }

      await course.update({ status: 4 });

      broadcastToCourse(courseId, {
        type: 'REWARDS_DISTRIBUTED',
        winner_count: winnerCount,
        on_chain_submitters: n,
      });
      broadcastToAll({ type: 'COURSE_UPDATED', course_id: Number(courseId), status: 4 });

      return { success: true, winner_count: winnerCount, on_chain_submitters: n };
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

      const submissions = await models.Submission.findAll({
        where: { course_id: courseId },
        attributes: ['student_address', 'is_auto_submit'],
      });
      const autoMap = new Map(submissions.map((s) => [s.student_address, s.is_auto_submit]));

      return results.map((r) => {
        const obj = r.toJSON();
        obj.auto_submitted = autoMap.get(obj.student_address) ?? null;
        return obj;
      });
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
          student_address: studentAddress,
        },
        attributes: ['rank_position', 'score', 'percentage', 'reward_amount'],
      });
      if (!result) return null;

      const submission = await models.Submission.findOne({
        where: { course_id: courseId, student_address: studentAddress },
        attributes: ['is_auto_submit'],
      });

      return {
        ...result.toJSON(),
        auto_submitted: submission?.is_auto_submit ?? null,
      };
    } catch (error) {
      throw new Error(`Failed to get student rank: ${error.message}`);
    }
  }
}

module.exports = new ResultService();
