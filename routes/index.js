const express = require('express');
const router = express.Router();
const Objective = require('../models/objective');
const Month = require('../models/month');
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
      const monthName = moment(new Date()).tz('Asia/Tokyo').format('YYYY-MM');
      res.render('index', {
        title: title,
        user: req.user,
        objectives: objectives,
        monthName: monthName
      });
    });
  } else {
    res.render('index', { title: title, user: req.user });
  }
});


module.exports = router;
