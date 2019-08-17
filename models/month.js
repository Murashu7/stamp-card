'use strict'
const loader = require('./sequelize-loader');
const Sequelize = loader.Sequelize;

const Month = loader.database.define('months', {
  monthId: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  monthName: {
    type: Sequelize.STRING,
    allowNull: false
  },
  objectiveId: {
    type: Sequelize.UUID,
    allowNull: false
  }
}, {
  freezeTableName: true,
  timestamps: false,
  indexes: [
    {
      fields: ['objectiveId']
    }
  ]
});

module.exports = Month;
