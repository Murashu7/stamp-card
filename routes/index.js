const express = require('express');
const router = express.Router();
const Objective = require('../models/objective');
const moment = require('moment-timezone');

/* GET home page. */
router.get('/', function(req, res, next) {
  const title = "スタンプカードくん";
  if (req.user) {
    Objective.findAll({
      where: {
        createdBy: req.user.id
      },
      order: [['"updatedAt"', 'DESC']]
    }).then((objectives) => {
      objectives.forEach((objective) => {
        objective.formattedDueDay = moment(objective.dueDay).tz('Asia/Tokyo').format('YYYY/MM/DD');
      });
      res.render('index', {
        title: title,
        user: req.user,
        objectives: objectives
      });
    });
  } else {
    res.render('index', { title: title, user: req.user });
  }
});

module.exports = router;
