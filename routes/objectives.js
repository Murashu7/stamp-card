'use strict'
const express = require('express')
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const uuid = require('uuid');
const Objective = require('../models/objective');
const Stamp = require('../models/stamp');

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
    Stamp.create({
      objectiveId: objectiveId,
      date: createdAt
    }).then((stamp) => {
      res.redirect('/objectives/' + objective.objectiveId);
    });
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
      Stamp.findOne({
        where: {
          objectiveId: req.params.objectiveId
          // date: req.params.createdAt
        },
      }).then((stamp) => {
        res.render('objective', {
          objective: objective,
          stamp: stamp
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
