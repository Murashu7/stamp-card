'use strict';
const request = require('supertest');
const app = require('../app');
const passportStub = require('passport-stub');
const moment = require('moment-timezone');

const User = require('../models/user');
const Objective = require('../models/objective');
const Month = require('../models/month');
const Stamp = require('../models/stamp');
const assert = require('assert');

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
      .expect(/<a href="\/auth\/github"/)
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
        .send({ objectiveName: 'テスト目的1', dueDay:'2019-09-01', memo: 'テストメモ1', frequency: 4, })
        .expect('Location', /objectives/)
        .expect(302)
        .end((err, res) => {
          let createdObjectivePath = res.headers.location;
          request(app)
            .get(createdObjectivePath)
            // 作成された目的が表示されていることをテストする
            .expect(/テスト目的1/)
            .expect(/2019\/09\/01/)
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
                assert.equal(months.length, 1, `stamps の要素数は 1 です`);
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
        .send({ objectiveName: 'テストスタンプ更新目的1', dueDay:'2019-09-01', memo: 'テストスタンプ更新メモ1', frequency: 4, })
        .end((err, res) => {
          const createdObjectivePath = res.header.location;
          const objectiveId = createdObjectivePath.split('/objectives/')[1].split('/months/')[0];
          const monthName = moment(new Date()).tz('Asia/Tokyo').format('YYYY-MM');
          Month.findOne({
            where: { objectiveId: objectiveId, monthName: monthName }
          }).then((month) => {
            const userId = 0;
            const stampName = "30";
            request(app)
              .post(`/objectives/${objectiveId}/months/${month.monthName}/stamps/${stampName}`)
              .send({ stampStatus: true })
              .expect('{"status":"OK","stampStatus":true}')
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

function deleteObjectiveAggregate(objectiveId, done, err) {
  Stamp.findAll({
    where: { objectiveId: objectiveId }
  }).then((stamps) => {
    const promises = stamps.map((s) => { return s.destroy(); });
    return Promise.all(promises);
  }).then(() => {
    return Month.findAll({
        where: { objectiveId: objectiveId }
    });
  }).then((months) => {
    const promises = months.map((m) => { return m.destroy(); });
    return Promise.all(promises);
  }).then(() => {
    Objective.findByPk(objectiveId).then((o) => { o.destroy(); });
    if (err) return done(err);
      done();
  });
}


