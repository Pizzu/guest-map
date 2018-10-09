const request = require('supertest');

const app = require('../src/app');

describe('GET /api/v1', () => {
  it('responds with a json message', function(done) {
    request(app)
      .get('/api/v1')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, {
        message: 'API - 👋🌎🌍🌏' 
      }, done);
  });
});

describe('POST /api/v1/messages', () => {
  it('responds with inserted message', function(done) {
    const requestObj = {
      name: 'Luca',
      message: 'This app is so cool!',
      latitude: -90,
      longitude: 180
    }
    const responseObj = {
      ...requestObj,
      _id: "5bbb7c71282dad78e00497d3",
      date: "2018-10-08T15:49:05.711Z"
    }
    request(app)
      .post('/api/v1/messages')
      .send(requestObj)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(res => {
        res.body._id = "5bbb7c71282dad78e00497d3";
        res.body.date = "2018-10-08T15:49:05.711Z";
      })
      .expect(200, responseObj, done);
  });
});
