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
    // TODO: stamp 集計操作
    return Objective.findOne({
      where: { objectiveId: objectiveId }
    }).then((objective) => {
      return aggregateStamps(objective, moment(new Date()));
    });
  }).then((objective) => {
    res.json({ 
      status: 'OK', 
      stampStatus: stampStatus, 
      achvRate: {
        freqAchvRate_p: objective.freqAchvRate_p,
        freqAchvRate_f: objective.freqAchvRate_f,
        objAchvRate_p: objective.objAchvRate_p,
        objAchvRate_f: objective.objAchvRate_f
       }
    });
  });
});

module.exports = router;

