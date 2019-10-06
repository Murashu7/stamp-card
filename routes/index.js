const express = require('express');
const router = express.Router();
const loader = require('../models/sequelize-loader');
const sequelize = loader.database;
const moment = require('moment-timezone');

const Objective = require('../models/objective');
const Month = require('../models/month');
const Stamp = require('../models/stamp');

const stampTypeObj = require('./stamp-type');
const AggregateStamps = require('./aggregate-stamps');
const colorLog = require('../utils/color-log.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  const title = "スタンプカードくん";
  let storedObjectives = null;
  const today = moment().tz('Asia/Tokyo').startOf('date');
  const monthName = moment(today).tz('Asia/Tokyo').format('YYYY-MM');

  if (req.user) {
    Objective.findAll({
      where: {
        createdBy: req.user.id
      },
      order: [['"updatedAt"', 'DESC']]
    }).then((objectives) => {

      const promises = objectives.map((objective) => {
        const aggregateStamps = new AggregateStamps(objective, today);
        objective.formattedDueDay = moment(objective.dueDay).tz('Asia/Tokyo').format('YYYY/MM/DD');
        // 集計操作
        return aggregateStamps.total();
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
