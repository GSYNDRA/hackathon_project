const models = require('../models');
const { Op } = require('sequelize');

class CourseService {
  async createCourse(data) {
    try {
      const course = await models.Course.create({
        on_chain_id: data.on_chain_id,
        teacher_address: data.teacher_address,
        name: data.name,
        description: data.description,
        category: data.category,
        thumbnail_url: data.thumbnail_url,
        tuition_amount: data.tuition_amount,
        max_students: data.max_students || 5,
        min_students: data.min_students || 2,
        status: data.status || 0
      });
      
      return course;
    } catch (error) {
      throw new Error(`Failed to create course: ${error.message}`);
    }
  }

  async getAllCourses(filters = {}) {
    try {
      const where = {};
      
      if (filters.status !== undefined) {
        where.status = filters.status;
      }
      
      if (filters.teacher) {
        where.teacher_address = filters.teacher;
      }

      const courses = await models.Course.findAll({
        where,
        include: [
          { 
            model: models.UserProfile, 
            as: 'teacher',
            attributes: ['wallet_address', 'username']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // Get enrollment counts
      const coursesWithCount = await Promise.all(
        courses.map(async (course) => {
          const enrolledCount = await models.Enrollment.count({
            where: { course_id: course.id }
          });
          return {
            ...course.toJSON(),
            enrolled_count: enrolledCount
          };
        })
      );

      return coursesWithCount;
    } catch (error) {
      throw new Error(`Failed to get courses: ${error.message}`);
    }
  }

  async getCourseById(id) {
    try {
      const course = await models.Course.findByPk(id, {
        include: [
          { 
            model: models.UserProfile, 
            as: 'teacher',
            attributes: ['wallet_address', 'username']
          },
          {
            model: models.ExamQuestion,
            as: 'questions',
            attributes: ['question_number', 'question_text', 'options']
          }
        ]
      });

      if (!course) {
        throw new Error('Course not found');
      }

      // Get enrollment count
      const enrolledCount = await models.Enrollment.count({
        where: { course_id: id }
      });

      return {
        ...course.toJSON(),
        enrolled_count: enrolledCount
      };
    } catch (error) {
      throw new Error(`Failed to get course: ${error.message}`);
    }
  }

  async updateCourseStatus(id, status, examTiming = {}) {
    try {
      const course = await models.Course.findByPk(id);
      if (!course) {
        throw new Error('Course not found');
      }

      const updateData = { status };
      
      if (examTiming.exam_start_time) {
        updateData.exam_start_time = examTiming.exam_start_time;
      }
      
      if (examTiming.exam_deadline) {
        updateData.exam_deadline = examTiming.exam_deadline;
      }

      await course.update(updateData);
      return course;
    } catch (error) {
      throw new Error(`Failed to update course status: ${error.message}`);
    }
  }

  async createExamQuestions(courseId, questions) {
    try {
      const createdQuestions = await Promise.all(
        questions.map(q => 
          models.ExamQuestion.create({
            course_id: courseId,
            question_number: q.question_number,
            question_text: q.question_text,
            options: q.options,
            correct_answer_idx: q.correct_answer_idx
          })
        )
      );
      
      return createdQuestions;
    } catch (error) {
      throw new Error(`Failed to create exam questions: ${error.message}`);
    }
  }

  async getExamQuestions(courseId, includeAnswers = false) {
    try {
      const attributes = ['question_number', 'question_text', 'options'];
      if (includeAnswers) {
        attributes.push('correct_answer_idx');
      }

      const questions = await models.ExamQuestion.findAll({
        where: { course_id: courseId },
        attributes,
        order: [['question_number', 'ASC']]
      });

      return questions;
    } catch (error) {
      throw new Error(`Failed to get exam questions: ${error.message}`);
    }
  }

  async startExam(courseId, startTime, deadline) {
    try {
      const course = await models.Course.findByPk(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      await course.update({
        status: 3, // EXAM_ACTIVE
        exam_start_time: startTime,
        exam_deadline: deadline
      });

      return course;
    } catch (error) {
      throw new Error(`Failed to start exam: ${error.message}`);
    }
  }
}

module.exports = new CourseService();
