'use strict'
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Stamp = require('../models/stamp');
const Month = require('../models/month');

router.post('/:objectiveId/months/:monthName/stamps/:stampName', authenticationEnsurer, (req, res, next) => {
  const objectiveId = req.params.objectiveId;
  const monthName = req.params.monthName;
  const stampName = req.params.stampName;
  const stampStatus = req.body.stampStatus;

  Month.findOne({
    where: { objectiveId: objectiveId, monthName: monthName }
  }).then((month) => {
    Stamp.upsert({
      stampName: stampName,
      stampStatus: stampStatus,
      monthId: month.monthId,
      objectiveId: objectiveId
    }).then(() => {
      res.json({ status: 'OK', stampStatus: stampStatus });
    });
  });
});

module.exports = router;

