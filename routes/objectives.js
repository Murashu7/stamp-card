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
  let storedObjective = null;
  let storedMonth = null;

  Objective.findOne({
    where: {
      objectiveId: req.params.objectiveId
    },
    order: [['"updatedAt"', 'DESC']]
  }).then((objective) => {
    if (objective) {
      storedObjective = objective;
      objective.formattedDueDay = moment(objective.dueDay).tz('Asia/Tokyo').format('YYYY/MM/DD');
      
      // TODO: 頻度と目標の達成率
      objective.freqAchvRate = '50%(20/40)';
      objective.objAchvRate = '20%(20/100)';

      return Month.findOrCreate({
        where: { objectiveId: req.params.objectiveId, monthName: req.params.monthName },
        order: [['"monthId"', 'ASC'], ['"monthName"', 'ASC']]
      });
    } else {
      const err = new Error('指定された目標は見つかりません');
      err.status = 404;
      next(err);
    }
  }).then(([month, created]) => {
    // TODO: Stamp
    storedMonth = month || created;
    return Stamp.findAll({
      where: { monthId: storedMonth.monthId },
      order: [['"stampName"', 'ASC']]
    });
  }).then((stamps) => {
    res.render('objective', {
      objective: storedObjective,
      month: storedMonth,
      today: new Date(),
      stamps: stamps
    });
  });
});

router.get('/:objectiveId/edit', authenticationEnsurer, (req, res, next) => {
  Objective.findOne({
    where: {
      objectiveId: req.params.objectiveId
    }
  }).then((objective) => {
    if (isMine(req, objective)) {
      objective.formattedDueDay = moment(objective.dueDay).tz('Asia-Tokyo').format('YYYY-MM-DD');
      res.render('edit', {
        user: req.user, // TODO:
        objective: objective
      });
    } else {
      const err = new Error('指定された目標がない、または編集する権限がありません');
      err.status  = 404;
      next(err);
    }
  });
});

const isMine = function(req, objective) {
  return objective && parseInt(objective.createdBy) === parseInt(req.user.id);
}

 module.exports = router;
