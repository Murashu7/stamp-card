'use strict'

const express = require('express')
const router = express.Router();
const uuid = require('uuid');
const { validationResult } = require("express-validator");
const validators = require('./validators');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

const User = require('../models/user');
const Objective = require('../models/objective');
const Month = require('../models/month');
const Stamp = require('../models/stamp');
const authenticationEnsurer = require('./authentication-ensurer');
const loader = require('../models/sequelize-loader');
const Op = loader.Op;

const moment = require('moment-timezone');
const stampTypeObj = require('./stamp-type');
const AggregateStamps = require('./aggregate-stamps');
const colorLog = require('../utils/color-log');

router.get('/new', authenticationEnsurer, csrfProtection, (req, res, next) => {
  res.render('new', { user: req.user, stampTypeObj: stampTypeObj, csrfToken: req.csrfToken() });
});

router.post('/', authenticationEnsurer, validators, csrfProtection, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render('new', {
      user: req.user, 
      objectiveName: req.body.objectiveName,
      stampType: req.body.stampType,
      stampTypeObj: stampTypeObj,
      memo: req.body.memo,
      dueDay: req.body.dueDay,
      frequency: req.body.frequency,
      csrfToken: req.csrfToken(),
      errors: errors.array()
    });
  } else {
    const objectiveId = uuid.v4();
    // TODO: TEST 用の日付
    // const today = moment('2019-09-29').tz('Asia/Tokyo').startOf('date');
    const today = moment().tz('Asia/Tokyo').startOf('date');

    Objective.create({
      objectiveId: objectiveId,
      objectiveName: req.body.objectiveName.slice(0, 255),
      stampType: req.body.stampType,
      memo: req.body.memo,
      createdBy: req.user.id,
      createdAt: today,
      updatedAt: today,
      dueDay: moment(req.body.dueDay).tz('Asia/Tokyo').startOf('date'),
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
      objective.formattedCreatedAt = moment(objective.createdAt).tz('Asia/Tokyo').format('YYYY/MM/DD');
      const aggregateStamps = new AggregateStamps(objective, moment().tz('Asia/Tokyo').startOf('date'));
      
      // 集計処理
      return aggregateStamps.total().then((objective) => {
        return aggregateStamps.thisWeek();
      }).then((objective) => {
        return Month.findOrCreate({
          where: { objectiveId: objective.objectiveId,  monthName: req.params.monthName },
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
      order: [['"stampDate"', 'ASC']]
    });
  }).then((stamps) => {
    const stampsData = stamps.map((s) => {
      const tmpObj = {};
      tmpObj['stampDate'] = s.stampDate;
      tmpObj['stampStatus'] = s.stampStatus;
      return tmpObj;
    });
    
    res.render('objective', {
      user: req.user,
      objective: storedObjective,
      month: storedMonth,
      today: moment().tz('Asia/Tokyo').startOf('date'),
      stamps: stampsData,
      stampTypeObj: stampTypeObj
    });
  });
});

router.get('/:objectiveId/edit', authenticationEnsurer, csrfProtection, (req, res, next) => {
  Objective.findOne({
    where: {
      objectiveId: req.params.objectiveId
    }
  }).then((objective) => {
    if (isMine(req, objective)) { // 作成者のみが編集フォームを開ける
      const monthName = req.query.month;
      objective.formattedDueDay = moment(objective.dueDay).tz('Asia/Tokyo').format('YYYY-MM-DD');
      res.render('edit', {
        user: req.user,
        objectiveId: objective.objectiveId,
        objectiveName: objective.objectiveName,
        stampType: objective.stampType,
        frequency: objective.frequency,
        formattedDueDay: objective.formattedDueDay,
        memo: objective.memo,
        monthName: monthName,
        stampTypeObj: stampTypeObj,
        csrfToken: req.csrfToken()
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

router.post('/:objectiveId', authenticationEnsurer, validators, csrfProtection, (req, res, next) => {
  const today = moment().tz('Asia/Tokyo').startOf('date');
  const errors = validationResult(req);
  if (!errors.isEmpty() && parseInt(req.query.edit) === 1) {
    res.render('edit', {
      user: req.user, 
      objectiveId: req.params.objectiveId,
      objectiveName: req.body.objectiveName,
      stampType: req.body.stampType,
      memo: req.body.memo,
      formattedDueDay: req.body.dueDay,
      frequency: req.body.frequency,
      monthName: req.query.month,
      stampTypeObj: stampTypeObj,
      csrfToken: req.csrfToken(),
      errors: errors.array()
    });
  } else {
    Objective.findOne({
      where: { objectiveId: req.params.objectiveId }
    }).then((objective) => {
      if (objective && isMine(req, objective)) {
        if (parseInt(req.query.edit) === 1) {
          const updatedAt = today;
          objective.update({
            objectiveId: objective.objectiveId,
            objectiveName: req.body.objectiveName.slice(0, 255),
            stampType: req.body.stampType,
            memo: req.body.memo,
            createdBy: req.user.id,
            updatedAt: updatedAt,
            dueDay: moment(req.body.dueDay).tz('Asia/Tokyo').startOf('date'),
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
  }
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
