'use strict'

const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Stamp = require('../models/stamp');
const Month = require('../models/month');
const Objective = require('../models/objective');
const colorLog = require('../utils/colorLog');
const aggregateStamps = require('./aggregateStamps');
const moment = require('moment');

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
      return aggregateStamps(objective, moment());
    });
  }).then((objective) => {
    res.json({ 
      status: 'OK', 
      stampStatus: stampStatus, 
      aggregate: {
        achievedNum: objective.achievedNum, // 今日までの達成数
        objAchvRate: objective.objAchvRate, // 今日まで達成率(%)
        remainingDays: objective.remainingDays // 期限日までの残日数
      }
    });
  });
});

module.exports = router;

