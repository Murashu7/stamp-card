'use strict'
const express = require('express')
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const uuid = require('uuid');
const User = require('../models/user');
const Objective = require('../models/objective');
const Month = require('../models/month');
const Stamp = require('../models/stamp');
const moment = require('moment-timezone');
const aggregateStamps = require('./aggregateStamps');

const colorLog = require('../utils/colorLog');

const { validationResult } = require("express-validator/check");
const validators = require('./validator');

router.get('/new', authenticationEnsurer, (req, res, next) => {
  res.render('new', { user: req.user });
});

router.post('/', authenticationEnsurer, validators, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render('new', {
      user: req.user, 
      objectiveName: req.body.objectiveName,
      memo: req.body.memo,
      dueDay: req.body.dueDay,
      frequency: req.body.frequency,
      errors: errors.array()
    });
  } else {
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
      return Month.create({
        monthName: parseMonthName(today),
        objectiveId: objective.objectiveId
      });
    }).then((month) => {
        res.redirect(`/objectives/${objectiveId}/months/${month.monthName}`);
    });
  }
});

router.get('/:objectiveId/months/:monthName', authenticationEnsurer, (req, res, next) => {
  let storedObjective = null;
  let storedMonth = null;

  Objective.findOne({
    include: [
      {
        model: User,
        attributes: ['userId', 'username']
      }],
    where: {
      objectiveId: req.params.objectiveId
    },
    order: [['"updatedAt"', 'DESC']]
  }).then((objective) => {
    if (objective) {
      storedObjective = objective;
      objective.formattedDueDay = moment(objective.dueDay).tz('Asia/Tokyo').format('YYYY/MM/DD');
      
      // TODO: 頻度と目標の達成率
      return aggregateStamps(objective, moment(new Date())).then((objective) => {
        return Month.findOrCreate({
          where: { objectiveId: objective.objectiveId, monthName: req.params.monthName },
          order: [['"monthId"', 'ASC'], ['"monthName"', 'ASC']]
        });
      });

    } else {
      const err = new Error('指定された目標は見つかりません');
      err.status = 404;
      next(err);
    }
  }).then(([month, created]) => {
    storedMonth = month || created;
    return Stamp.findAll({
      where: { monthId: storedMonth.monthId },
      order: [['"stampName"', 'ASC']]
    });
  }).then((stamps) => {
    res.render('objective', {
      user: req.user,
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
    if (isMine(req, objective)) { // 作成者のみが編集フォームを開ける
      const monthName = req.query.month;
      objective.formattedDueDay = moment(objective.dueDay).tz('Asia/Tokyo').format('YYYY-MM-DD');
      res.render('edit', {
        // user: req.user, // TODO: この user は必要か？
        objective: objective,
        monthName: monthName
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

router.post('/:objectiveId', authenticationEnsurer, (req, res, next) => {
  const today = new Date();

  Objective.findOne({
    where: { objectiveId: req.params.objectiveId }
  }).then((objective) => {
    if (objective && isMine(req, objective)) {
      if (parseInt(req.query.edit) === 1) {
        const updatedAt = today;
        objective.update({
          objectiveId: objective.objectiveId,
          objectiveName: req.body.objectiveName.slice(0, 255),
          memo: req.body.memo,
          createdBy: req.user.id,
          updatedAt: updatedAt,
          dueDay: new Date(req.body.dueDay),
          frequency: req.body.frequency
        }).then((objective) => {
          const monthName = req.query.month || parseMonthName(today);
          if (monthName) {
            res.redirect(`/objectives/${objective.objectiveId}/months/${monthName}`);
          } 
        });
      } else if (parseInt(req.query.delete) === 1) {
        deleteObjectiveAggregate(req.params.objectiveId, () => {
          res.redirect('/');
        });
      } else {
        const err = new Error('不正なリクエストです');
        err.status = 400;
        next(err);
      }
    } else {
      const err = new Error('指定された目標がない、または編集する権限がありません');
      err.status = 404;
      next(err);
    }
  });
});

const parseMonthName = function(today) {
  return  moment(today).tz('Asia/Tokyo').format('YYYY-MM');
}

router.deleteObjectiveAggregate = deleteObjectiveAggregate;

function deleteObjectiveAggregate(objectiveId, done, err) {
  Stamp.findAll({
    where: { objectiveId: objectiveId }
  }).then((stamps) => {
    const promises = stamps.map((s) => { return s.destroy(); });
    return Promise.all(promises);
  }).then(() => {
    return Month.findAll({
        where: { objectiveId: objectiveId }
    });
  }).then((months) => {
    const promises = months.map((m) => { return m.destroy(); });
    return Promise.all(promises);
  }).then(() => {
    return Objective.findByPk(objectiveId).then((o) => { o.destroy(); });
  }).then(() => {
    if (err) return done(err);
    done();
  });
}

module.exports = router;
