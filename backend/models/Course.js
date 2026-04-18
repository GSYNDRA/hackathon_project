module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define('Course', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    on_chain_id: {
      type: DataTypes.STRING(66),
      allowNull: false,
      unique: true
    },
    teacher_address: {
      type: DataTypes.STRING(66),
      allowNull: false,
      references: {
        model: 'user_profiles',
        key: 'wallet_address'
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    thumbnail_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tuition_amount: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    max_students: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 5
    },
    min_students: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 2
    },
    status: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 0
    },
    exam_start_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    exam_deadline: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'courses',
    timestamps: true,
    underscored: true
  });

  Course.associate = (models) => {
    Course.belongsTo(models.UserProfile, { foreignKey: 'teacher_address', as: 'teacher' });
    Course.hasMany(models.ExamQuestion, { foreignKey: 'course_id', as: 'questions' });
    Course.hasMany(models.Enrollment, { foreignKey: 'course_id', as: 'enrollments' });
    Course.hasMany(models.Submission, { foreignKey: 'course_id', as: 'submissions' });
    Course.hasMany(models.Result, { foreignKey: 'course_id', as: 'results' });
  };

  return Course;
};
