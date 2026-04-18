module.exports = (sequelize, DataTypes) => {
  const Submission = sequelize.define('Submission', {
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
    student_address: {
      type: DataTypes.STRING(66),
      allowNull: false
    },
    answers: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    answers_hash: {
      type: DataTypes.STRING(66),
      allowNull: false
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    time_taken_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    is_auto_submit: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    on_chain_tx_digest: {
      type: DataTypes.STRING(88),
      allowNull: true
    }
  }, {
    tableName: 'submissions',
    timestamps: false,
    underscored: true
  });

  Submission.associate = (models) => {
    Submission.belongsTo(models.Course, { foreignKey: 'course_id', as: 'course' });
    Submission.belongsTo(models.UserProfile, { foreignKey: 'student_address', as: 'student' });
  };

  return Submission;
};
