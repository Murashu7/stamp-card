'use strict';

const request = require('supertest');
const app = require('../app');
const passportStub = require('passport-stub');
const moment = require('moment-timezone');
const assert = require('assert');
const deleteObjectiveAggregate = require('../routes/objectives').deleteObjectiveAggregate;

const loader = require('../models/sequelize-loader');
const Op = loader.Op;

const User = require('../models/user');
const Objective = require('../models/objective');
const Month = require('../models/month');
const Stamp = require('../models/stamp');

const AggregateStamps = require('../routes/aggregate-stamps.js');
const WeekRange = require('../routes/moment-week-range');
const colorLog = require('../utils/color-log');

describe('/login', () => {

  // テスト前
  before(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser', _json: {avatar_url: "https://avatars/dummy"}});
  });

  // テスト後
  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  it('ログインのためのリンクが含まれる', (done) => {
    request(app)
      .get('/login')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/<a class="btn btn-info btn-block my-5" href="\/auth\/github"/)
      .expect(200, done);
  });

  it('ログイン時はアバターの url が含まれる', (done) => {
    request(app)
      .get('/')
      .expect(/<img src="https:\/\/avatars\/dummy"/)
      .expect(200, done);
  });
  
  it('ログイン時はユーザー名が含まれる', (done) => {
    request(app)
      .get('/')
      .expect(/testuser/)
      .expect(200, done);
  });

  it('ログアウト時は / にリダイレクトされる', (done) => {
    request(app)
      .get('/logout')
      .expect('Location', '/')
      .expect(302, done);
  });

});

describe('/objectives', () => {
  before(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });

  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  it('目標が作成でき、表示される', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      const dueDayStr = moment().add(2, 'month').tz('Asia/Tokyo').format('YYYY-MM-DD'); // dueDayStr は today の 2 ヶ月後
      request(app)
        .get('/objectives/new')
        .end((err, res) => {
          const match = res.text.match(/<input type="hidden" name="_csrf" value="(.*?)">/);
          const csrf = match[1];

          request(app)
            .post('/objectives')
            .set('cookie', res.headers['set-cookie'])
            .send({ objectiveName: 'テスト目的1', stampType: 'star',  dueDay: dueDayStr, memo: 'テストメモ1', frequency: 4, _csrf:csrf })
            .expect('Location', /objectives/)
            .expect(302)
            .end((err, res) => {
              let createdObjectivePath = res.headers.location;
              const dueDayPattarn = new RegExp(`${moment(dueDayStr).tz('Asia/Tokyo').format('YYYY/MM/DD')} まで`);
              request(app)
                .get(createdObjectivePath)
                // 作成された目的が表示されていることをテストする
                .expect(/&#x2b50;/) // スタンプ star
                .expect(/テスト目的1/)
                .expect(dueDayPattarn)
                .expect(/4 回/)
                .expect(/テストメモ1/)
                .expect(200)
                .end((err, res) => {
                  // month のテスト
                  const objectiveId = createdObjectivePath.split('/objectives/')[1].split('/months/')[0];
                  const monthName = moment().tz('Asia/Tokyo').format('YYYY-MM');
                  Month.findAll({
                    where: { objectiveId: objectiveId }
                  }).then((months) => {
                    assert.equal(months.length, 1, `months の要素数は 1 です`);
                    assert.equal(months[0].monthName, monthName);
                  });
                  // テストで作成したデータを削除
                  deleteObjectiveAggregate(objectiveId, done, err);
                });
            });
        });
    });
  });
});

describe('/objectives/:objectiveId/months/:monthName/stamps/:stampDate', () => {
  before(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });

  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  it('スタンプが更新できる', (done) => {
    const dueDayStr = moment().add(2, 'month').tz('Asia/Tokyo').format('YYYY-MM-DD'); // dueDay は today の 2 ヶ月後
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      request(app)
        .get('/objectives/new')
        .end((err, res) => {
          const match = res.text.match(/<input type="hidden" name="_csrf" value="(.*?)">/);
          const csrf = match[1];

          request(app)
            .post('/objectives')
            .set('cookie', res.headers['set-cookie'])
            .send({ objectiveName: 'テストスタンプ更新目的1', stampType: 'circle', dueDay: dueDayStr, memo: 'テストスタンプ更新メモ1', frequency: 4, _csrf: csrf })
            .end((err, res) => {
              const createdObjectivePath = res.header.location;
              const objectiveId = createdObjectivePath.split('/objectives/')[1].split('/months/')[0];
              const monthName = moment().tz('Asia/Tokyo').format('YYYY-MM');
              Month.findOne({
                where: { objectiveId: objectiveId , monthName: monthName }
              }).then((month) => {
                const stampDate = 30;
                request(app)
                  .post(`/objectives/${objectiveId}/months/${month.monthName}/stamps/${stampDate}`)
                  .send({ stampStatus: true })
                  // 集計結果は別テストで検証(今日の日付 = テスト日によって集計結果が都度変わるため)
                  .expect(/\{"status":"OK","stampStatus":true,"aggregate":{"thisWeekAchvNum":/)
                  .end((err, res) => {
                    Stamp.findAll({
                      where: { objectiveId: objectiveId }
                    }).then((stamps) => {
                      assert.equal(stamps.length, 1, `stampsの要素の数は 1 です`);
                      assert.equal(stamps[0].monthId, month.monthId);
                      assert.equal(stamps[0].stampStatus, true);
                      assert.equal(stamps[0].objectiveId, objectiveId);
                      deleteObjectiveAggregate(objectiveId, done, err);
                    });
                  });
              });
            });
          });
        });
    });
});


describe('/objective/:objectiveId?edit=1&month=:monthName', () => {
  before(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });

  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  it('目標が編集できる', (done) => {
    const dueDayStr = moment().add(2, 'month').tz('Asia/Tokyo').format('YYYY-MM-DD'); // dueDay は today の 2 ヶ月後
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      request(app)
        .get('/objectives/new')
        .end((err, res) => {
          const match = res.text.match(/<input type="hidden" name="_csrf" value="(.*?)">/);
          const csrf = match[1];
          const setCookie = res.headers['set-cookie'];

          request(app)
            .post('/objectives')
            .set('cookie', setCookie)
            .send({ objectiveName: 'テスト更新目的1', stampType: 'circle', dueDay: dueDayStr, memo: 'テスト更新メモ1', frequency: 2, _csrf: csrf })
            .end((err, res) => {
              const createdObjectivePath = res.headers.location;
              const objectiveId = createdObjectivePath.split('/objectives/')[1].split('/months/')[0];
              const monthName = moment().tz('Asia/Tokyo').format('YYYY-MM');
              request(app)
                .post(`/objectives/${objectiveId}?edit=1&month=${monthName}`)
                .set('cookie', setCookie)
                .send({ objectiveName: 'テスト更新目的2', stampType: 'star', dueDay: dueDayStr, memo: 'テスト更新メモ2', frequency: 2, _csrf: csrf })
                .end((err, res) => {
                  Objective.findByPk(objectiveId).then((o) => {
                    assert.equal(o.objectiveName, 'テスト更新目的2');
                    assert.equal(o.stampType, 'star');
                    assert.equal(moment(o.dueDay).tz('Asia/Tokyo').format('YYYY-MM-DD'), dueDayStr);
                    assert.equal(o.memo, 'テスト更新メモ2');
                    assert.equal(o.frequency, 2)
                  });
                  Month.findAll({
                    where: { objectiveId: objectiveId },
                    order: [['"objectiveId"', 'ASC']]
                  }).then((months) => {
                    assert.equal(months.length, 1);
                    assert.equal(months[0].monthName, monthName);
                    deleteObjectiveAggregate(objectiveId, done, err);
                  });
                });
            });
        });
    });
  });
});


describe('/objectives/:objectiveId?delete=1', () => {
  before(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });

  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  it('目標に関する全ての情報を削除できる', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      const dueDayStr = moment().add(2, 'month').tz('Asia/Tokyo').format('YYYY-MM-DD'); // dueDay は today の 2 ヶ月後
      request(app)
        .get('/objectives/new')
        .end((err, res) => {
          const match = res.text.match(/<input type="hidden" name="_csrf" value="(.*?)">/);
          const csrf = match[1];
          const setCookie = res.header['set-cookie'];

          request(app)
            .post('/objectives')
            .set('Cookie', setCookie)
            .send({ objectiveName: 'テスト削除目標1', stampType: 'circle',  memo: 'テスト削除メモ1', frequency: 4, dueDay: dueDayStr, _csrf: csrf })
            .end((err, res) => {
              const createdObjectivePath = res.headers.location;
              const objectiveId = createdObjectivePath.split('/objectives/')[1].split('/months/')[0];
              const monthName = moment().tz('Asia/Tokyo').format('YYYY-MM');

              // stamp 作成
              const promiseStamp = Month.findOne({
                where: { 
                  objectiveId: objectiveId,
                  monthName: monthName
                }
              }).then((month) => {
                const stampDate = 1;
                return new Promise((resolve) => {
                  request(app)
                    .post(`/objectives/${objectiveId}/months/${month.monthName}/stamps/${stampDate}`)
                    .send({ stampStatus: true })
                    .end((err, res) => {
                      if (err) done(err);
                      resolve();
                    });
                });
              });

              // 削除
              const promiseDeleted = promiseStamp.then(() => {
                return new Promise((resolve) => {
                  request(app)
                    .post(`/objectives/${objectiveId}?delete=1`)
                    .set('Cookie', setCookie)
                    .send({ _csrf: csrf })
                    .end((err, res) => {
                      if (err) done(err);
                      resolve();
                    });
                });
              });

              // test
              promiseDeleted.then(() => {
                const p1 = Stamp.findAll({
                  where: { objectiveId: objectiveId }
                }).then((stamps) => {
                  assert.equal(stamps.length, 0);
                });
                const p2 = Month.findAll({
                  where: { objectiveId: objectiveId }
                }).then((months) => {
                  assert.equal(months.length, 0);
                });
                const p3 = Objective.findByPk(objectiveId).then((objective) => {
                  assert.equal(!objective, true);
                });
                Promise.all([p1, p2, p3]).then(() => {
                  if (err) return done(err);
                  done();
                });
              });
            });
        });
    });
  });
});

describe('aggregate-stamps', () => {
  // テスト前
  before(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });

  // テスト後
  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  it('全スタンプの集計結果が正しいか確認', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      const today = moment().tz('Asia/Tokyo').startOf('date'); // today はテストを実行した今日
      const frequency = 4;
      const dueDayStr = today.clone().add(1, 'month').tz('Asia/Tokyo').format('YYYY-MM-DD'); // dueDay は today の 1 ヶ月後
      request(app)
        .get('/objectives/new')
        .end((err, res) => {
          const match = res.text.match(/<input type="hidden" name="_csrf" value="(.*?)">/);
          const csrf = match[1];
          request(app)
            .post('/objectives')
            .set('Cookie', res.headers['set-cookie'])
            .send({ objectiveName: 'テスト集計目標1', stampType: 'circle',  memo: 'テスト集計メモ1', frequency: frequency, dueDay: dueDayStr, _csrf: csrf })
            .end((err, res) => {
              const createdObjectivePath = res.headers.location;
              const objectiveId = createdObjectivePath.split('/objectives/')[1].split('/months/')[0];
              const dueDay = moment(dueDayStr);
              
              // スタンプ集計用データ
              const wr = new WeekRange(today, today, dueDay);
              const elapsedDays = wr.elapsedDays();
              const totalGoalTimes = AggregateStamps.calcTotalGoalTimes(elapsedDays, frequency); // 開始日から今日までの目標回数
              const monthNames = AggregateStamps.createMonthNames(wr.start, wr.end); // ふた月にまたぐ場合あり
              const start2endDates = WeekRange.arrayDatesRange(wr.start, wr.end); // 開始日から終了日までの日付の配列
              const stampDateMap = AggregateStamps.createStampDateMap(monthNames, start2endDates);
              const totalStampNum = start2endDates.length;
              
              // スタンプ作成
              const monthNamesPromises = monthNames.map((monthName) => {
                return Month.findOrCreate({
                  where: {
                    objectiveId: objectiveId,
                    monthName: monthName
                  }
                }).then(([month, created]) => {
                  const m = month || created;
                  return stampDateMap.get(m.monthName).map((stampDate) => {
                    return new Promise((resolve) => {
                      request(app)
                        .post(`/objectives/${objectiveId}/months/${m.monthName}/stamps/${stampDate}`)
                        .send({ stampStatus: true })
                        .end((err, res) => {
                          if (err) done(err);
                          resolve();
                        });
                    });
                  });
                }).then((promises) => {
                  return Promise.all(promises);
                });
              });

              Promise.all(monthNamesPromises).then(() => {
                return Objective.findOne({
                  where: { objectiveId: objectiveId }
                });
              }).then((objective) => {
                // 集計テスト
                // 全てのスタンプ集計
                const aggregateStamps = new AggregateStamps(objective, today);
                return aggregateStamps.total()
              }).then((objective) => {
                assert.equal(objective.totalAchvNum, totalStampNum);
                assert.equal(objective.totalAchvRate, Math.round((totalStampNum / totalGoalTimes) * 100));
                assert.equal(objective.totalAchvRate, AggregateStamps.calcAchvRate(totalStampNum, totalGoalTimes));
                if (err) return done(err);
                deleteObjectiveAggregate(objectiveId, done, err);
              });
            });
        });
     });
  });


  it('今週分のスタンプの集計結果が正しいか確認', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      const today = moment().tz('Asia/Tokyo').startOf('date'); // today はテストを実行した今日
      const frequency = 4;
      const dueDayStr = today.clone().add(1, 'month').tz('Asia/Tokyo').format('YYYY-MM-DD'); // dueDay は today の 1 ヶ月後
      request(app)
        .get('/objectives/new')
        .end((err, res) => {
          const match = res.text.match(/<input type="hidden" name="_csrf" value="(.*?)">/);
          const csrf = match[1];
          request(app)
            .post('/objectives')
            .set('Cookie', res.headers['set-cookie'])
            .send({ objectiveName: 'テスト集計目標1', stampType: 'circle',  memo: 'テスト集計メモ1', frequency: frequency, dueDay: dueDayStr, _csrf: csrf })
            .end((err, res) => {
              const createdObjectivePath = res.headers.location;
              const objectiveId = createdObjectivePath.split('/objectives/')[1].split('/months/')[0];
              const dueDay = moment(dueDayStr).tz('Asia/Tokyo').startOf('date');
              
              // スタンプ集計用データ
              const wr = new WeekRange(today, today, dueDay);
              const monthNames = AggregateStamps.createMonthNames(wr.start, wr.end);
              const start2endDates = WeekRange.arrayDatesRange(wr.start, wr.end); // 開始日から終了日までの日付の配列
              const stampDateMap = AggregateStamps.createStampDateMap(monthNames, start2endDates);
              const currentDates = WeekRange.arrayDatesRange(wr.currentRange[0], wr.currentRange[1]); // 今週の配列(今週が 7 日以下の場合もある)
              const currentGoalTimes =  AggregateStamps.calcThisWeekGoalTimes(currentDates.length, frequency);           
              const currentStampNum = currentDates.length;
              
              // スタンプ作成
              const monthNamesPromises = monthNames.map((monthName) => {
                return Month.findOrCreate({
                  where: {
                    objectiveId: objectiveId,
                    monthName: monthName
                  }
                }).then(([month, created]) => {
                  const m = month || created;
                  return stampDateMap.get(m.monthName).map((stampDate) => {
                    return new Promise((resolve) => {
                      request(app)
                        .post(`/objectives/${objectiveId}/months/${m.monthName}/stamps/${stampDate}`)
                        .send({ stampStatus: true })
                        .end((err, res) => {
                          if (err) done(err);
                          resolve();
                        });
                    });
                  });
                }).then((promises) => {
                  return Promise.all(promises);
                });
              });
              Promise.all(monthNamesPromises).then(() => {
                return Objective.findOne({
                  where: { objectiveId: objectiveId }
                });
              }).then((objective) => {
                // 集計テスト
                // 今週のスタンプ集計
                const aggregateStamps = new AggregateStamps(objective, today);
                return aggregateStamps.thisWeek();
              }).then((objective) => {
                assert.equal(objective.thisWeekAchvNum, currentStampNum);
                assert.equal(objective.thisWeekAchvRate, AggregateStamps.calcAchvRate(currentStampNum, currentGoalTimes));
                if (err) return done(err);
                deleteObjectiveAggregate(objectiveId, done, err);
              });
            });
        });
     });
  });
});
