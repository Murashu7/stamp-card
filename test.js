'use strict'

const moment = require('moment-timezone');

const createdAt = moment('2019-09-03');
const dueDay = moment('2019-10-05');
const today = moment('2019-09-29');

const curRange = setupCurrentRange(today, createdAt, dueDay); 
const monthNameArray = createMontNameArray(curRange[0], curRange[1]);
const currentArray = arrayDate(curRange[0], curRange[1]);
const stampNameMap = createStampNameMap(monthNameArray, currentArray);
console.log({ stampNameMap });

// TODO: アプリ用処理
monthNameArray.forEach((m) => {
  if (stampNameMap.has(m)) {
    console.log(stampNameMap.get(m));
  }
});

function createStampNameMap(monthNameArray, currentArray) {
  const stampNameMap = new Map();
  monthNameArray.forEach((monthName) => {
    const stampNameArray = [];
    currentArray.forEach((c) => {
      if (monthName === createMonthNameFromDate(c)) {
        const stampName  = createStampNameFromDate(c);
        stampNameArray.push(stampName);
      }
    });
    stampNameMap.set(monthName, stampNameArray); 
  });
  return stampNameMap;
}

function createMontNameArray(date1, date2) {
  const startMonthName = createMonthNameFromDate(date1);
  const endMonthName = createMonthNameFromDate(date2);
  const monthNameArray = [];
  monthNameArray.push(startMonthName);
  if (startMonthName !== endMonthName) {
    monthNameArray.push(endMonthName);
  }
  return monthNameArray;
}

function createStampNameFromDate(date) {
  return date.tz('Asia/Tokyo').format('DD');
}
function createMonthNameFromDate(date) {
  return date.tz('Asia/Tokyo').format('YYYY-MM');
}

// 今日までの目標回数
function goalTimes(frequency, elapsedDays) {
  return (frequency * Math.ceil(elapsedDays / 7));
}


// TODO: 汎用処理
// 開始日、現在、終了日の週範囲の情報を取得する

// 開始日から今日までの経過日数
function elapsedDays(currentDay, startDay) {
  return currentDay.diff(startDay, 'day') + 1; 
}

// 今日から終了日までの残日数
function remainingDays(currentDay, endDay) {
  return endDay.diff(currentDay, 'day') + 1; 
}

function arrayDate(startDate, endDate) {
  const result = [];
  for (let i = 0; startDate.isSameOrBefore(endDate); i++) {
    const cloneDate = startDate.clone();
    startDate.add(1, 'day');
    result.push(cloneDate);
  }
  return result; 
}

function setupCurrentRange(currentDay, startDate, endDay) {
  const stRange = startRange(startDate);
  const eRange = endRange(endDay);
  const curRange = currentRange(currentDay);

  if (endDay.isSameOrBefore(stRange[1])) {
    stRange[1] = endDay;
    eRange[0] = stRange[0];
  }
  if (currentDay.isSameOrBefore(stRange[1])) {
    curRange[0] = stRange[0];
    curRange[1] = stRange[1];
  } else if (currentDay.isSameOrAfter(eRange[0])) {
    curRange[1] = eRange[1];
  }
  return curRange;
}

function dateBeginningWeek(date) {
  const cloneDate = date.clone();
  const dayOfWeek = date.day();
  const diff = 0 - dayOfWeek;
  const dateBeginningWeek = cloneDate.add(diff, 'day');
  return dateBeginningWeek;
}

function dateWeekend(date){
  const cloneDate = date.clone();
  const dayOfWeek = date.day();
  const diff = 6 - dayOfWeek;
  const dateWeekend = cloneDate.add(diff, 'day');
  return dateWeekend;
}

function startRange(startDate) {
  const result = [];
  result.push(startDate);
  result.push(dateWeekend(startDate));
  return result;
}

function endRange(endDate) {
  const cloneDate = endDate.clone();
  const result = [];
  result.push(dateBeginningWeek(cloneDate));
  result.push(endDate);
  return result;
}

function currentRange(today) {
  const result = [];
  result.push(dateBeginningWeek(today));
  result.push(dateWeekend(today));
  return result;
}
