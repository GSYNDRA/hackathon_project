module.exports = (sequelize, DataTypes) => {
  const ExamQuestion = sequelize.define('ExamQuestion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id'
      }
    },
    question_number: {
      type: DataTypes.SMALLINT,
      allowNull: false
    },
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    options: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    correct_answer_idx: {
      type: DataTypes.SMALLINT,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'exam_questions',
    timestamps: false,
    underscored: true
  });

  ExamQuestion.associate = (models) => {
    ExamQuestion.belongsTo(models.Course, { foreignKey: 'course_id', as: 'course' });
  };

  return ExamQuestion;
};
