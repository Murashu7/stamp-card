'use strict'

const moment = require('moment');

class WeekRange {
  constructor(startDate, currentDate, endDate) {
    Array.from(arguments).forEach((a) => {
       if (!(a instanceof moment)) {
        throw new Error(`${a} is not instance of moment.`);
       }
    });
    if (!(startDate.unix() <= currentDate.unix() && startDate.unix() <= endDate.unix())) {
      throw new Error('Parameter date order is incorrect.');
    }

    this._currentDate = currentDate.tz('Asia/Tokyo').startOf('date');
    this._startDate = startDate.tz('Asia/Tokyo').startOf('date');
    this._endDate = endDate.tz('Asia/Tokyo').startOf('date');

    this.setupRange = () => {
      this._startRange = this._createStartRange(this.start);
      this._endRange = this._createEndRange(this.end);
      this._currentRange = this._createCurrentRange(this.current);
      if (this.end.isSameOrBefore(this.startRange[1])) {
        this.startRange[1] = this.end;
        this.endRange[0] = this.startRange[0];
      }
      if (this.current.isSameOrBefore(this.startRange[1])) {
        this.currentRange[0] = this.startRange[0];
        this.currentRange[1] = this.startRange[1];
      } else if (this.current.isSameOrAfter(this.endRange[0])) {
        this.currentRange[1] = this.endRange[1];
      }
      // TODO: とりあえず、範囲が 1 日の場合は開始と終了が同じ日付の配列を作成 
      // 日付の範囲がない（要素が重複している）場合は片方の要素を削除
      // this._deleteDateDuplicate(this.startRange);
      // this._deleteDateDuplicate(this.endRange);
      // this._deleteDateDuplicate(this.currentRange);
    }
    this.setupRange();
  }

  _deleteDateDuplicate(dateRange) {
    if (this._isDateSame(dateRange[0], dateRange[1])) {
      dateRange.pop(); // 削除
    } 
  }

  _isDateSame(date_0, date_1) {
    return (date_0.isSame(date_1))
  }

  get start() {
    return this._startDate;
  }
  
  get end() {
    return this._endDate;
  }

  get current() {
    return this._currentDate;
  }

  get startRange() {
    return this._startRange;
  }
  
  get endRange() {
    return this._endRange;
  }

  get currentRange() {
    return this._currentRange;
  }
 
  elapsedDays() {
    return this.current.diff(this.start, 'day') + 1; 
  }

  remainingDays() {
    return this.end.diff(this.current, 'day') + 1; 
  }

  static arrayDatesRange(startDate, endDate) {
    Array.from(arguments).forEach((a) => {
       if (!(a instanceof moment)) {
        throw new Error(`${a} is not instance of moment.`);
       }
    });
    if (!(startDate.unix() <= endDate.unix())) {
      throw new Error('The date order is incorrect.');
    }
    const result = [];
    const cloneDate = startDate.clone();
    for (let i = 0; cloneDate.isSameOrBefore(endDate); i++) {
      const cd = cloneDate.clone();
      result.push(cd);
      cloneDate.add(1, 'day');
    }
    return result; 
  }

  _dateBeginningWeek(date) {
    const cloneDate = date.clone();
    const dayOfWeek = date.day();
    const diff = 0 - dayOfWeek;
    const dateBeginningWeek = cloneDate.add(diff, 'day');
    return dateBeginningWeek;
  }

  _dateWeekend(date){
    const cloneDate = date.clone();
    const dayOfWeek = date.day();
    const diff = 6 - dayOfWeek;
    const dateWeekend = cloneDate.add(diff, 'day');
    return dateWeekend;
  }

  _createStartRange() {
    const result = [];
    const cloneDate = this.start.clone();
    result.push(cloneDate);
    const dateWeekend = this._dateWeekend(cloneDate);
    result.push(dateWeekend);
    return result;
  }

  _createEndRange() {
    const result = [];
    const cloneDate = this.end.clone();
    const dateBeginningWeek = this._dateBeginningWeek(cloneDate);
    result.push(dateBeginningWeek);
    result.push(this.end);
    return result;
  }

  _createCurrentRange() {
    const result = [];
    const cloneDate = this.current;
    const dateBeginnigWeek = this._dateBeginningWeek(cloneDate); 
    const dateWeekend = this._dateWeekend(cloneDate);
    result.push(dateBeginnigWeek);
    result.push(dateWeekend);
    return result;
  }
}

module.exports = WeekRange;
