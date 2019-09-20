'use strict'

const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const moment = require('moment');

const Objective = require('../models/objective');
const Stamp = require('../models/stamp');
const Month = require('../models/month');

const colorLog = require('../utils/colorLog');
const totalAggregateStamps = require('./aggregate-stamps').totalAggregateStamps;
const thisWeekAggregateStamps = require('./aggregate-stamps').thisWeekAggregateStamps;

router.post('/:objectiveId/months/:monthName/stamps/:stampName', authenticationEnsurer, (req, res, next) => {
  const objectiveId = req.params.objectiveId;
  const monthName = req.params.monthName;
  const stampName = req.params.stampName;
  const stampStatus = req.body.stampStatus;

  Month.findOne({
    where: { objectiveId: objectiveId, monthName: monthName }
  }).then((month) => {
   return  Stamp.findOrCreate({
      where: {
        monthId: month.monthId,
        stampName: stampName
      },
      defaults: {
        stampStatus: stampStatus,
        objectiveId: objectiveId
      }
   });
  }).then(([stamp, created]) => {
    if (stamp) {
      return stamp.update({
        stampStatus: stampStatus,
      });
    }
  }).then(() => {
    // stamp 集計操作
    return Objective.findOne({
      where: { objectiveId: objectiveId }
    }).then((objective) => {
      const today = moment().startOf('date');
      return totalAggregateStamps(objective, today).then((objective) => {
        return thisWeekAggregateStamps(objective, today);
      });
    });
  }).then((objective) => {
    res.json({ 
      status: 'OK', 
      stampStatus: stampStatus, 
      aggregate: {
        thisWeekAchvNum: objective.thisWeekAchvNum, // 今週の達成数
        thisWeekAchvRate: objective.thisWeekAchvRate, // 今週の達成率(%)
        totalAchvNum: objective.totalAchvNum, // 今日までの総達成数
        totalAchvRate: objective.totalAchvRate, // 今日まで総達成率(%)
        elapsedDays: objective.elapsedDays, // 開始日からの経過日数
        remainingDays: objective.remainingDays // 期限日までの残日数
      }
    });
  });
});

module.exports = router;

