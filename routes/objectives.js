'use strict'
const express = require('express')
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const uuid = require('uuid');
const Objective = require('../models/objective');
const Month = require('../models/month');
const Stamp = require('../models/stamp');
const moment = require('moment-timezone');

router.get('/new', authenticationEnsurer, (req, res, next) => {
  res.render('new', { user: req.user });
});

router.post('/', authenticationEnsurer, (req, res, next) => {
  const objectiveId = uuid.v4();
  const today = new Date();

  Objective.create({
    objectiveId: objectiveId,
    objectiveName: req.body.objectiveName.slice(0, 255),
    memo: req.body.memo,
    createdBy: req.user.id,
    createdAt: today,
    updatedAt: today,
    dueDay: new Date(req.body.dueDay),
    frequency: req.body.frequency
  }).then((objective) => {
    const monthName = moment(today).tz('Asia/Tokyo').format('YYYY-MM');
    Month.create({
      monthName: monthName,
      objectiveId: objectiveId
    }).then((month) => {
      res.redirect(`/objectives/${objective.objectiveId}/months/${month.monthName}`);
    });
  });
});

router.get('/:objectiveId/months/:monthName', authenticationEnsurer, (req, res, next) => {
  Objective.findOne({
    where: {
      objectiveId: req.params.objectiveId
    },
    order: [['"updatedAt"', 'DESC']]
  }).then((objective) => {
    if (objective) {
      objective.formattedDueDay = moment(objective.dueDay).tz('Asia/Tokyo').format('YYYY/MM/DD');
      // TODO: 頻度と目標の達成率
      objective.freqAchvRate = '50%(20/40)';
      objective.objAchvRate = '20%(20/100)';

      Month.findOrCreate({
        where: { objectiveId: req.params.objectiveId, monthName: req.params.monthName },
      }).then(([month, created]) => {
        // TODO: Stamp
        const m = month || created;
        Stamp.findAll({
          where: { monthId: m.monthId },
          order: [['"stampId"', 'ASC']]
        }).then((stamps) => {
          res.render('objective', {
            objective: objective,
            month: month || created,
            today: new Date(),
            stamps: stamps
          });
        });
      });
      
    } else {
      const err = new Error('指定された目的は見つかりません');
      err.status = 404;
      next(err);
    }
  });
});

module.exports = router;
