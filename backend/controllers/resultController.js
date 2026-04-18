const resultService = require('../services/resultService');

class ResultController {
  async create(req, res) {
    try {
      const { course_id } = req.params;
      const { results } = req.body;
      
      if (!Array.isArray(results)) {
        return res.status(400).json({ error: 'Results must be an array' });
      }
      
      const createdResults = await resultService.createResults(course_id, results);
      
      res.json({
        success: true,
        results_count: createdResults.length
      });
    } catch (error) {
      console.error('Create results error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateRewards(req, res) {
    try {
      const { course_id } = req.params;

      const result = await resultService.updateRewards(course_id);

      res.json({
        success: true,
        message: 'Rewards updated successfully',
        winner_count: result.winner_count,
      });
    } catch (error) {
      console.error('Update rewards error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getByCourse(req, res) {
    try {
      const { course_id } = req.params;
      
      // Check if course is scored or beyond
      const models = require('../models');
      const course = await models.Course.findByPk(course_id);
      
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }
      
      if (course.status < 3) { // SCORED = 3
        return res.status(403).json({ error: 'Results not available yet' });
      }
      
      const results = await resultService.getResultsByCourse(course_id);
      
      res.json(results);
    } catch (error) {
      console.error('Get results error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getStudentRank(req, res) {
    try {
      const { course_id } = req.params;
      const { student_address } = req.query;
      
      const rank = await resultService.getStudentRank(course_id, student_address);
      
      if (!rank) {
        return res.status(404).json({ error: 'Result not found for this student' });
      }
      
      res.json(rank);
    } catch (error) {
      console.error('Get student rank error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ResultController();
