'use strict'
const express = require('express')
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const uuid = require('uuid');
const Objective = require('../models/objective');
const Stamp = require('../models/stamp');
const moment = require('moment-timezone');

router.get('/new', authenticationEnsurer, (req, res, next) => {
  res.render('new', { user: req.user });
});

router.post('/', authenticationEnsurer, (req, res, next) => {
  const objectiveId = uuid.v4();
  const createdAt = new Date();

  Objective.create({
    objectiveId: objectiveId,
    objectiveName: req.body.objectiveName.slice(0, 255),
    memo: req.body.memo,
    createdBy: req.user.id,
    createdAt: createdAt,
    updatedAt: createdAt,
    dueDay: new Date(req.body.dueDay),
    frequency: req.body.frequency
  }).then((objective) => {
    res.redirect('/objectives/' + objective.objectiveId);
  });
});

router.get('/:objectiveId', authenticationEnsurer, (req, res, next) => {
  Objective.findOne({
    where: {
      objectiveId: req.params.objectiveId
    },
    order: [['"updatedAt"', 'DESC']]
  }).then((objective) => {
    if (objective) {
      objective.today = new Date();
      objective.formattedDueDay = moment(objective.dueDay).tz('Asia/Tokyo').format('YYYY/MM/DD');
      // TODO: 頻度と目標の達成率
      objective.freqAchvRate = '50%(20/40)';
      objective.objAchvRate = '20%(20/100)';

      res.render('objective', {
        objective: objective,
      });

    } else {
      const err = new Error('指定された目的は見つかりません');
      err.status = 404;
      next(err);
    }
  });
});
module.exports = router;
