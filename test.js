'use strict'
const moment = require('moment-timezone');

const createdAt = moment('2019-09-01');
const dueDay = moment('2019-10-01');
const today = moment('2019-09-15');

const startRange = getStartRange(createdAt);
const endRange = getEndRange(dueDay);
const currentRange = getCurrentRange(today);

if (dueDay.isSameOrBefore(startRange[1])) {
  startRange[1] = dueDay;
  endRange[0] = startRange[0];
}
if (today.isSameOrBefore(startRange[1])) {
  currentRange[0] = startRange[0];
  currentRange[1] = startRange[1];
} else if (today.isSameOrAfter(endRange[0])) {
  currentRange[1] = endRange[1];
}
const currentArray = getArrayDate(currentRange[0], currentRange[1]);

console.log({ currentArray });



function getArrayDate(startDate, endDate) {
  const result = [];
  const cloneDate = startDate.clone();
  result.push(cloneDate);
  for (let i = 0; startDate.isSameOrBefore(endDate); i++) {
    startDate.add(1, 'day');
    const cloneDate = startDate.clone();
    result.push(cloneDate);
  }
  return result; 
}

function getDatebeginningWeek(date) {
  const cloneDate = date.clone();
  const dayOfWeek = date.day();
  const diff = 0 - dayOfWeek;
  const dateBeginningWeek = cloneDate.add('day', diff);
  return dateBeginningWeek;
}

function getDateWeekend(date){
  const cloneDate = date.clone();
  const dayOfWeek = date.day();
  const diff = 6 - dayOfWeek;
  const dateWeekend = cloneDate.add('day', diff);
  return dateWeekend;
}

function getStartRange(startDate) {
  const results = [];
  results.push(startDate);
  const dateWeekend = getDateWeekend(startDate); 
  results.push(dateWeekend);
  return results;
}

function getEndRange(endDate) {
  const cloneDate = endDate.clone();
  const results = [];
  results.push(getDatebeginningWeek(cloneDate));
  results.push(endDate);
  return results;
}

function getCurrentRange(today) {
  const results = [];
  results.push(getDatebeginningWeek(today));
  results.push(getDateWeekend(today));
  return results;
}
