'use strict'

const Month = require('../models/month');
const Stamp = require('../models/stamp');
const moment = require('moment-timezone');
const loader = require('../models/sequelize-loader');
const sequelize = loader.database;
const colorLog = require('../utils/colorLog');

const aggregateStamps = function(objective, today) {
  const createdAt = moment(objective.createdAt); // 開始日
  const dueDay = moment(objective.dueDay); // 終了日
  const frequency = objective.frequency; // 目標回数
  const elapsedDays = today.diff(createdAt, 'day') + 1; // 開始日から今日までの経過日数
  const remainingDays = dueDay.diff(today, 'day') + 1; // 今日から終了日までの残日数
  const goalTimes = (frequency * Math.ceil(elapsedDays / 7)); // 開始日から今日までの目標回数
  // const goalTimes_StoD = (frequency * diffWeeks_d); // 作成日から期限までの目標回数

/*
  Month.findOne({
    where: {
      objectiveId: objective.objectiveId,
      monthName: [monthName_1, monthName_2, ...]
    }
  }).then((month) => {
  })
*/

  return Stamp.findOne({
    where: { 
      objectiveId: objective.objectiveId,
      stampStatus: true
    },
    attributes: [
      [sequelize.fn('count', sequelize.col('stampStatus')), 'countStatus']
    ]
  }).then((result) => {
    return new Promise((resolve) => {
       const achievedNum = result.dataValues['countStatus'];
       objective.achievedNum = achievedNum; // 今日までの達成数
       objective.objAchvRate = Math.round((achievedNum / goalTimes) * 100); // 今日まで達成率(%)
       objective.remainingDays = remainingDays; // 期限日までの残日数
       resolve(objective);
    });
  })
}

module.exports = aggregateStamps;
