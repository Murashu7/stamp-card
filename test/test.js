'use strict';
const request = require('supertest');
const app = require('../app');
const passportStub = require('passport-stub');
const moment = require('moment-timezone');
const assert = require('assert');
const deleteObjectiveAggregate = require('../routes/objectives').deleteObjectiveAggregate;

const User = require('../models/user');
const Objective = require('../models/objective');
const Month = require('../models/month');
const Stamp = require('../models/stamp');


describe('/login', () => {

  // テスト前
  before(() => {
    passportStub.install(app);
    passportStub.login({ username: 'testuser' });
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
      .expect(/<a class="btn btn-info my-3" href="\/auth\/github"/)
      .expect(200, done);
  });

  it('ログイン時はユーザー名が表示される', (done) => {
    request(app)
      .get('/login')
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

  it('予定が作成でき、表示される', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      request(app)
        .post('/objectives')
        .send({ objectiveName: 'テスト目的1', dueDay:'2025-09-01', memo: 'テストメモ1', frequency: 4, })
        .expect('Location', /objectives/)
        .expect(302)
        .end((err, res) => {
          let createdObjectivePath = res.headers.location;
          request(app)
            .get(createdObjectivePath)
            // 作成された目的が表示されていることをテストする
            .expect(/テスト目的1/)
            .expect(/2025\/09\/01/)
            .expect(/4/)
            .expect(/テストメモ1/)
            .expect(200)
            .end((err, res) => {
              // month のテスト
              const objectiveId = createdObjectivePath.split('/objectives/')[1].split('/months/')[0];
              const monthName = moment(new Date()).tz('Asia/Tokyo').format('YYYY-MM');
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

describe('/objectives/:objectiveId/months/:monthName/stamps/:stampName', () => {
  before(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });

  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  it('スタンプが更新できる', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      request(app)
        .post('/objectives')
        .send({ objectiveName: 'テストスタンプ更新目的1', dueDay:'2025-09-01', memo: 'テストスタンプ更新メモ1', frequency: 4, })
        .end((err, res) => {
          const createdObjectivePath = res.header.location;
          const objectiveId = createdObjectivePath.split('/objectives/')[1].split('/months/')[0];
          const monthName = moment(new Date()).tz('Asia/Tokyo').format('YYYY-MM');
          Month.findOne({
            where: { objectiveId: objectiveId, monthName: monthName }
          }).then((month) => {
            const stampName = "30";
            request(app)
              .post(`/objectives/${objectiveId}/months/${month.monthName}/stamps/${stampName}`)
              .send({ stampStatus: true })
              // テストを実行した日によって期限日までの週数は変わってくるので省略
              .expect(/\{"status":"OK","stampStatus":true,"achvRate":{"freqAchvRate_p":25,"freqAchvRate_f":"\( 1 ／ 4 \)","objAchvRate_p":0,"objAchvRate_f":"\( 1 ／/)
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
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      request(app)
        .post('/objectives')
        .send({ objectiveName: 'テスト更新目的1', dueDay:'2025-09-01', memo: 'テスト更新メモ1', frequency: 2 })
        .end((err, res) => {
          const createdObjectivePath = res.headers.location;
          const objectiveId = createdObjectivePath.split('/objectives/')[1].split('/months/')[0];
          const monthName = moment(new Date()).tz('Asia/Tokyo').format('YYYY-MM');
          request(app)
            .post(`/objectives/${objectiveId}?edit=1&month=${"2025-09-01"}`)
            .send({ objectiveName: 'テスト更新目的2', dueDay:'2030-02-01', memo: 'テスト更新メモ2', frequency: 2 })
            .end((err, res) => {
              Objective.findByPk(objectiveId).then((o) => {
                assert.equal(o.objectiveName, 'テスト更新目的2');
                assert.equal(moment(o.dueDay).tz('Asia/Tokyo').format('YYYY-MM-DD'), '2030-02-01');
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
      request(app)
        .post('/objectives')
        .send({ objectiveName: 'テスト削除目標1', memo: 'テスト削除メモ1', frequency: 4, dueDay: '2019-12-01' })
        .end((err, res) => {
          const createdObjectivePath = res.headers.location;
          const objectiveId = createdObjectivePath.split('/objectives/')[1].split('/months/')[0];
          const monthName = moment(new Date()).tz('Asia/Tokyo').format('YYYY-MM');

          // stamp 作成
          const promiseStamp = Month.findOne({
            where: { 
              objectiveId: objectiveId,
              monthName: monthName
            }
          }).then((month) => {
            const stampName = "1";
            return new Promise((resolve) => {
              request(app)
                .post(`/objectives/${objectiveId}/months/${month.monthName}/stamps/${stampName}`)
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
