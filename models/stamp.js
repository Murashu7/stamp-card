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
  stampName: {
    type: Sequelize.STRING,
    allowNull: false
  },
  stampStatus: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
   },
  type: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "circle"
  },
  color: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  monthId: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  objectiveId: {
    type: Sequelize.UUID,
    allowNull: false
  }
}, {
  freezeTableName: true,
  timestamps: false
});

module.exports = Stamp;
