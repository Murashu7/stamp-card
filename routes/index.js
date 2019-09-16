const express = require('express');
const router = express.Router();
const Objective = require('../models/objective');
const Month = require('../models/month');
const Stamp = require('../models/stamp');

const moment = require('moment-timezone');
const colorLog = require('../utils/colorLog.js');

const loader = require('../models/sequelize-loader');
const sequelize = loader.database;
const aggregateStamps = require('./aggregateStamps');
const stampTypeObj = require('./stamp-type');

/* GET home page. */
router.get('/', function(req, res, next) {
  const title = "スタンプカードくん";
  let storedObjectives = null;
  const today = moment().startOf('date');
  const monthName = moment(today).tz('Asia/Tokyo').format('YYYY-MM');

  if (req.user) {
    Objective.findAll({
      where: {
        createdBy: req.user.id
      },
      order: [['"updatedAt"', 'DESC']]
    }).then((objectives) => {

      const promises = objectives.map((objective) => {
        objective.formattedDueDay = moment(objective.dueDay).tz('Asia/Tokyo').format('YYYY/MM/DD');
        return aggregateStamps(objective, today);
      });
      return Promise.all(promises);

    }).then((objectives) => {
      res.render('index', {
        title: title,
        user: req.user,
        objectives: objectives,
        monthName: monthName,
        stampTypeObj: stampTypeObj
      });
    });
  } else {
    res.render('index', { title: title, user: req.user });
  }
});

module.exports = router;
