'use strict'

const Stamp = require('../models/stamp');
const moment = require('moment-timezone');
const loader = require('../models/sequelize-loader');
const sequelize = loader.database;
const colorLog = require('../utils/colorLog');

const aggregateStamps = function(objective, today) {
  const createdAt = moment(objective.createdAt); // 作成日
  const dueDay = moment(objective.dueDay); // 期限日
  const frequency = objective.frequency;
  const diffWeeks_t = today.diff(createdAt, 'weeks') + 1; // 作成日から今日までの週数
  const diffWeeks_d = dueDay.diff(createdAt, 'weeks') + 1; // 作成日から期限までの週数
  const goalTimes_t = (frequency * diffWeeks_t); // 作成日から今日までの目標回数
  const goalTimes_d = (frequency * diffWeeks_d); // 作成日から期限までの目標回数

  // TODO: 
  const result = getDailyArray(today).filter((day) => {
    return today.isSameOrAfter(moment(day), 'week')
  }).map((day) => {
    return moment(day).date();
  });

  const d = moment('2019-09-05').tz('Asia/Tokyo');
  colorLog.color('red', d);
  colorLog.color('blue', getDatebeginningWeek(d));
  colorLog.color('yellow', getDateWeekend(d));
  colorLog.color('green', getStartRange(d));
  colorLog.color('black', getEndRange(d));
  colorLog.color('magenta', getCurrentRange(d));

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
       const implTimes = result.dataValues['countStatus'];
       objective.freqAchvRate_p = Math.round((implTimes / goalTimes_t) * 100); // 今日までの達成率(%)
       objective.freqAchvRate_f = `( ${implTimes} ／ ${goalTimes_t} )`; // 今日までの達成率(分数)
       objective.objAchvRate_p = Math.round((implTimes / goalTimes_d) * 100); // 期限日まで達成率(%)
       objective.objAchvRate_f = `( ${implTimes} ／ ${goalTimes_d} )`; // 期限日までの達成率(分数)
       resolve(objective);
    });
  })
}

// TODO: 
function getDatebeginningWeek(date) {
  const cloneDate = date.clone();
  const dayOfWeek = date.day();
  const diff = 0 - dayOfWeek;
  const dateBeginningWeek = cloneDate.add('day', diff);
  return dateBeginningWeek;
}

function getDateWeekend(date){
  const cloneDate = date.clone();
  const dayOfWeek = date.day();
  const diff = 6 - dayOfWeek;
  const dateWeekend = cloneDate.add('day', diff);
  return dateWeekend;
}

function getStartRange(startDate) {
  const results = [];
  results.push(startDate);
  const dateWeekend = getDateWeekend(startDate); 
  results.push(dateWeekend);
  return results;
}

function getEndRange(endDate) {
  const cloneDate = endDate.clone();
  const results = [];
  results.push(getDatebeginningWeek(cloneDate));
  results.push(endDate);
  return results;
}

function getCurrentRange(today) {
  const results = [];
  results.push(getDatebeginningWeek(today));
  results.push(getDateWeekend(today));
  return results;
}

const getDailyArray = (month) => {
  const start = moment(month).startOf('month');
  const end = moment(month).endOf('month');
  const results = [];
  while(start.unix() <= end.unix()) {
    results.push(start.format('YYYY-MM-DD'));
    start.add(1, 'days');
  }
  return results
}

module.exports = aggregateStamps;
