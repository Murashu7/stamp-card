'use strict'
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Stamp = require('../models/stamp');
const Month = require('../models/month');

router.post('/:objectiveId/months/:monthName/stamps/:stampId', authenticationEnsurer, (req, res, next) => {
  const objectiveId = req.params.objectiveId;
  const monthName = req.params.monthName;
  const stampId = req.params.stampId;
  const stampStatus = req.body.stampStatus;

  Month.findOne({
    where: { objectiveId: objectiveId, monthName: monthName }
  }).then((month) => {
    Stamp.upsert({
      stampId: stampId,
      objectiveId: objectiveId,
      monthId: month.monthId,
      stampStatus: stampStatus
    }).then(() => {
      res.json({ status: 'OK', stampStatus: stampStatus });
    });
  });
});

module.exports = router;

