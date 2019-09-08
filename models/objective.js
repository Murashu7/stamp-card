'use strict'
const loader = require('./sequelize-loader');
const Sequelize = loader.Sequelize;

const Objective = loader.database.define('objectives', {
  objectiveId: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false
  },
  objectiveName: {
    type: Sequelize.STRING,
    allowNull: false
  },
  stampType: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "circle"
  },
  dueDay: {
    type: Sequelize.DATE,
    allowNull: false
  },
  frequency: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  memo: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  createdAt: {
    type: Sequelize.DATE,
    allowNull: false
  },
  updatedAt: {
    type: Sequelize.DATE,
    allowNull: false
  },
  createdBy: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
}, {
  freezeTableName: true,
  timestamps: false,
  indexes: [
    {
      fields: ['createdBy']
    }
  ]
});

module.exports = Objective;
