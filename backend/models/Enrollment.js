module.exports = (sequelize, DataTypes) => {
  const Enrollment = sequelize.define('Enrollment', {
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
      allowNull: false,
      references: {
        model: 'user_profiles',
        key: 'wallet_address'
      }
    },
    amount_paid: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    enrolled_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    on_chain_tx_digest: {
      type: DataTypes.STRING(88),
      allowNull: true
    }
  }, {
    tableName: 'enrollments',
    timestamps: false,
    underscored: true
  });

  Enrollment.associate = (models) => {
    Enrollment.belongsTo(models.Course, { foreignKey: 'course_id', as: 'course' });
    Enrollment.belongsTo(models.UserProfile, { foreignKey: 'student_address', as: 'student' });
  };

  return Enrollment;
};
