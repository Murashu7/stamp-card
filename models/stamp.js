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
  objectiveId: {
    type: Sequelize.UUID,
    allowNull: false
  },
  monthId: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  stampDate: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  stampStatus: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
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
