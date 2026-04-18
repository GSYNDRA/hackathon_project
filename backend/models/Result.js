module.exports = (sequelize, DataTypes) => {
  const Result = sequelize.define('Result', {
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
    score: {
      type: DataTypes.SMALLINT,
      allowNull: false
    },
    percentage: {
      type: DataTypes.SMALLINT,
      allowNull: false
    },
    correct_count: {
      type: DataTypes.SMALLINT,
      allowNull: false
    },
    total_questions: {
      type: DataTypes.SMALLINT,
      allowNull: false
    },
    time_taken_seconds: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rank_position: {
      type: DataTypes.SMALLINT,
      allowNull: false
    },
    reward_amount: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    scored_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rewarded_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'results',
    timestamps: false,
    underscored: true
  });

  Result.associate = (models) => {
    Result.belongsTo(models.Course, { foreignKey: 'course_id', as: 'course' });
    Result.belongsTo(models.UserProfile, { foreignKey: 'student_address', as: 'student' });
  };

  return Result;
};
