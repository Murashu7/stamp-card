'use strict'
const loader = require('./sequelize-loader');
const Sequelize = loader.Sequelize;

const Stamp = loader.database.define('stamps', {
  stampId: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  statusList: {
    type: Sequelize.ARRAY(Sequelize.BOOLEAN),
    allowNull: false,
    defaultValue: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
  },
  date: {
    type: Sequelize.DATE,
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

module.exports = Stamp;
