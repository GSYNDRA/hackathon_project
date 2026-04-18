module.exports = (sequelize, DataTypes) => {
  const UserProfile = sequelize.define('UserProfile', {
    wallet_address: {
      type: DataTypes.STRING(66),
      primaryKey: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('teacher', 'student'),
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'user_profiles',
    timestamps: false,
    underscored: true
  });

  UserProfile.associate = (models) => {
    UserProfile.hasMany(models.Course, { foreignKey: 'teacher_address', as: 'courses' });
    UserProfile.hasMany(models.Enrollment, { foreignKey: 'student_address', as: 'enrollments' });
    UserProfile.hasMany(models.Submission, { foreignKey: 'student_address', as: 'submissions' });
    UserProfile.hasMany(models.Result, { foreignKey: 'student_address', as: 'results' });
  };

  return UserProfile;
};
