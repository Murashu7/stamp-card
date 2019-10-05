'use strict'

const Month = require('../models/month');
const Stamp = require('../models/stamp');
const loader = require('../models/sequelize-loader');
const sequelize = loader.database;
const Sequelize = loader.Sequelize;
const Op = loader.Sequelize.Op;
const moment = require('moment-timezone');
const WeekRange = require('./moment-week-range');
const colorLog = require('../utils/color-log');

// 総達成回数を集計する
const totalAggregateStamps = function(objective, today) {
  const frequency = objective.frequency; // 目標回数
  const createdAt = moment(objective.createdAt); // 開始日
  const dueDay = moment(objective.dueDay); // 終了日
  const weekRange = new WeekRange(createdAt, today, dueDay);
  const elapsedDays = weekRange.elapsedDays(); // 開始日から今日までの経過日数
  const remainingDays = weekRange.remainingDays(); // 今日から終了日までの残日数
  const goalTimes = (frequency * Math.ceil(elapsedDays / 7)); // 開始日から今日までの目標回数

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
       const totalAchvNum = result.dataValues['countStatus'];
       objective.totalAchvNum = totalAchvNum; // 今日までの達成数
       objective.totalAchvRate = Math.round((totalAchvNum / goalTimes) * 100); // 今日まで達成率(%)
       objective.elapsedDays = elapsedDays; // 今日までの経過日数
       objective.remainingDays = remainingDays; // 期限日までの残日数
       resolve(objective);
    });
  })
}

// 今週の達成回数を集計する
const thisWeekAggregateStamps = function(objective, today) {
  const objectiveId = objective.objectiveId;
  const frequency = objective.frequency; // 目標回数
  const createdAt = moment(objective.createdAt).tz('Asia/Tokyo'); // 開始日
  const dueDay = moment(objective.dueDay).tz('Asia/Tokyo'); // 終了日

  const weekRange = new WeekRange(createdAt, today, dueDay);
  const monthNames = createMonthNames(weekRange.currentRange[0], weekRange.currentRange[1]);
  const currentDates = WeekRange.arrayDatesRange(weekRange.currentRange[0], weekRange.currentRange[1]);
  const stampDateMap = createStampDateMap(monthNames, currentDates);
  const goalTimes =  Math.ceil((currentDates.length / 7) * frequency); // 今週の目標回数(今週が 7 日以下の場合もある)

  return Month.findAll({
    where: {
      objectiveId: objectiveId,
      monthName: monthNames
    },
    order: [['"monthName"', 'ASC']]
  }).then((months) => {
    return months.map((m) => {
      return m.monthId;
    });
  }).then((monthIds) => {
    const attrsStr = createAttrsStr(monthIds, monthNames, stampDateMap);

    return Stamp.findOne({
      where: { 
        stampStatus: true
      },
      attributes: 
        // TODO:
        // Function('"use strict";return (' + attrsStr + ')')()
        eval(attrsStr)
    }).then((result) => {
      return new Promise((resolve) => {
        const thisWeekAchvNum = Object.values(result.dataValues).reduce((total, value) => Number(total) + Number(value));
        objective.thisWeekAchvNum = thisWeekAchvNum; // 今週の達成数
        objective.thisWeekAchvRate = Math.round((thisWeekAchvNum / goalTimes) * 100); // 今週の達成率(%)
        resolve(objective);
      });
    })
  });
}

function createStampNames(monthNames, dates) {
  const results = [];
  dates.forEach((c) => { 
    monthNames.forEach((monthName) => {
      if (monthName === createMonthNameFromDate(c)) {
        results.push(createStampDate(c));
      }
    });
  });
  return results;
}

function createStampDateMap(monthNames, dates) {
  const map = new Map();
  monthNames.forEach((monthName) => { 
    let array = [];
    dates.forEach((date) => {
      if (monthName === createMonthNameFromDate(date)) {
        array.push(createStampDate(date));
        map.set(monthName, array);
      }
    });
  });
  return map;
}

function createMonthNames(date1, date2) {
  const startMonthName = createMonthNameFromDate(date1);
  const endMonthName = createMonthNameFromDate(date2);
  const monthNames = [];
  monthNames.push(startMonthName);
  if (startMonthName !== endMonthName) {
    monthNames.push(endMonthName);
  }
  return monthNames;
}

// stampDate を作成
function createStampDate(date) {
  const stampDate = date.tz('Asia/Tokyo').format('DD'); 
  if (stampDate[0] === '0') {
    return stampDate.slice(1);
  }
  return stampDate;
}

function createMonthNameFromDate(date) {
  return date.tz('Asia/Tokyo').format('YYYY-MM');
}

function createAttrsStr(monthIds, monthNames, stampDateMap) {
  console.log({ monthIds });
  console.log({ monthNames });
  console.log({ stampDateMap });
  let attrsStr = '[';
  monthIds.forEach((monthId, index) => {
    attrsStr +=  `[sequelize.fn('count', {[Op.or]: [{[Op.and]: [{"monthId": ${monthId}}, {"stampDate": {[Op.in]:[${stampDateMap.get(monthNames[index])}]}}]}, Sequelize.literal('NULL')]}), '${index}_count']`;
     if ((monthIds.length != (index + 1))) {
       attrsStr += ','
     }
  });
  attrsStr += ']';
  return attrsStr;
}

module.exports = {
  totalAggregateStamps: totalAggregateStamps,
  thisWeekAggregateStamps: thisWeekAggregateStamps,
  createStampNames: createStampNames,
  createMonthNames: createMonthNames,
  createStampDateMap: createStampDateMap
}
