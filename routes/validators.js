'use strict'

const { check } = require("express-validator");
const moment = require('moment-timezone');

const validators = [
  check("objectiveName")
    .trim()
    .escape()
    .not().isEmpty().withMessage("入力してください")
    .isLength({ max: 50 }).withMessage("50 文字以内で入力してください"),
  check("stampType")
    .escape()
    .not().isEmpty().withMessage("スタンプを選択してください"),
  check("frequency")
    .escape()
    .not().isEmpty().withMessage("回数を選択してください [ 1 - 7 ]")
    .matches(/^\d$/).withMessage("回数を選択してください [ 1 - 7 ]"),
  check("dueDay")
    .escape()
    .custom((value, { req }) => {
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const today = moment(moment(new Date()).tz('Asia/Tokyo').format('YYYY-MM-DD'));
        const dueDay = moment(moment(value).tz('Asia/Tokyo').format('YYYY-MM-DD'));
        if (dueDay.isAfter(today)) {
          return Promise.resolve(value);
        } else {
          return Promise.reject("今日より後の日付を選択してください");
        }
      } else {
        return Promise.reject("日付を選択してください");
      }
    }),
  check("memo")
    .trim()
    .escape()
    .isLength({ max: 255 }).withMessage("メモは 255 文字以内で入力してください")
]

module.exports = validators;
