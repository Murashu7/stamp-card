'use strict';
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost/stamp_card',
  {
    // operatorsAliases: false
  });

module.exports = {
  database: sequelize,
  Sequelize: Sequelize,
  Op: Op
};
