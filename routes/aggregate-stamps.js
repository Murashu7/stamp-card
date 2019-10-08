'use strict'

const Month = require('../models/month');
const Stamp = require('../models/stamp');
const loader = require('../models/sequelize-loader');
const sequelize = loader.database;
const Sequelize = loader.Sequelize;
const Op = loader.Op;
const moment = require('moment-timezone');
const WeekRange = require('./moment-week-range');
const colorLog = require('../utils/color-log');

class AggregateStamps {

  constructor(objective, today) {
    this._objective = objective;
    this._frequency = objective.frequency; // 目標回数
    this._createdAt = moment(objective.createdAt); // 開始日
    this._dueDay = moment(objective.dueDay); // 終了日
    this._weekRange = new WeekRange(this.createdAt, today, this.dueDay);
    this._elapsedDays = this.weekRange.elapsedDays(); // 開始日から今日までの経過日数
    this._remainingDays = this.weekRange.remainingDays(); // 今日から終了日までの残日数
  }

  get objective() {
    return this._objective;
  }
 
  get frequency() {
    return this._frequency;
  }

  get createdAt() {
    return this._createdAt;
  }

  get dueDay() {
    return this._dueDay;
  }

  get weekRange() {
    return this._weekRange;
  }

  get elapsedDays() {
    return this._elapsedDays;
  }

  get remainingDays() {
    return this._remainingDays;
  }

  // 総達成回数を集計する
  total() {
    const goalTimes = AggregateStamps.calcTotalGoalTimes(this.elapsedDays, this.frequency); // 開始日から今日までの目標回数

    return Stamp.findOne({
      where: {
        objectiveId: this.objective.objectiveId,
        stampStatus: true
      },
      attributes: [
        [sequelize.fn('count', sequelize.col('stampStatus')), 'countStatus']
      ]
    }).then((result) => {
      return new Promise((resolve) => {
         const totalAchvNum = result.dataValues['countStatus'];
         this.objective.totalAchvNum = totalAchvNum; // 今日までの達成数
         this.objective.totalAchvRate = AggregateStamps.calcAchvRate(totalAchvNum, goalTimes); // 今日まで達成率(%)
         this.objective.elapsedDays = this.elapsedDays; // 今日までの経過日数
         this.objective.remainingDays = this.remainingDays; // 期限日までの残日数
         resolve(this.objective);
      });
    })
  }

  // 今週の達成回数を集計する
  thisWeek() {
    const monthNames = AggregateStamps.createMonthNames(this.weekRange.currentRange[0], this.weekRange.currentRange[1]);
    const currentDates = WeekRange.arrayDatesRange(this.weekRange.currentRange[0], this.weekRange.currentRange[1]);
    const stampDateMap = AggregateStamps.createStampDateMap(monthNames, currentDates);
    const goalTimes =  AggregateStamps.calcThisWeekGoalTimes(currentDates.length, this.frequency); // 今週の目標回数(今週が 7 日以下の場合もある)

    return Month.findAll({
      where: {
        objectiveId: this.objective.objectiveId,
        monthName: monthNames
      },
      order: [['"monthName"', 'ASC']]
    }).then((months) => {
      return months.map((m) => {
        return m.monthId;
      });
    }).then((monthIds) => {
      const attrsStr = this.createAttrsStr(monthIds, monthNames, stampDateMap);

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
          this.objective.thisWeekAchvNum = thisWeekAchvNum; // 今週の達成数
          this.objective.thisWeekAchvRate = Math.round((thisWeekAchvNum / goalTimes) * 100); // 今週の達成率(%)
          this.objective.thisWeekAchvRate = AggregateStamps.calcAchvRate(thisWeekAchvNum, goalTimes); // 今週の達成率(%)
          resolve(this.objective);
        });
      })
    });
  }

  static createStampNames(monthNames, dates) {
    const results = [];
    dates.forEach((c) => { 
      monthNames.forEach((monthName) => {
        if (monthName === this.createMonthNameFromDate(c)) {
          results.push(this.createStampDate(c));
        }
      });
    });
    return results;
  }

  static createStampDateMap(monthNames, dates) {
    const map = new Map();
    monthNames.forEach((monthName) => { 
      let array = [];
      dates.forEach((date) => {
        if (monthName === this.createMonthNameFromDate(date)) {
          array.push(this.createStampDate(date));
          map.set(monthName, array);
        }
      });
    });
    return map;
  }

  static createMonthNames(date1, date2) {
    const startMonthName = this.createMonthNameFromDate(date1);
    const endMonthName = this.createMonthNameFromDate(date2);
    const monthNames = [];
    monthNames.push(startMonthName);
    if (startMonthName !== endMonthName) {
      monthNames.push(endMonthName);
    }
    return monthNames;
  }

  static createStampDate(date) {
    const stampDate = date.tz('Asia/Tokyo').format('DD'); 
    if (stampDate[0] === '0') {
      return stampDate.slice(1);
    }
    return stampDate;
  }

  static createMonthNameFromDate(date) {
    return date.tz('Asia/Tokyo').format('YYYY-MM');
  }

  static calcTotalGoalTimes(elapsedDays, frequency) {
    return (frequency * Math.ceil(elapsedDays / 7)); // 開始日から今日までの目標回数
  }

  static calcThisWeekGoalTimes(datesLength, frequency) {
    return Math.ceil((datesLength / 7) * frequency)
  }

  static calcAchvRate(achvNum, goalTimes) {
    return Math.round((achvNum / goalTimes) * 100);
  }

  createAttrsStr(monthIds, monthNames, stampDateMap) {
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
}

module.exports = AggregateStamps;
