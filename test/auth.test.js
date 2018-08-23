'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { TEST_MONGODB_URI, JWT_SECRET, JWT_EXPIRY } = require('../config');
const User = require('../models/user');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Noteful API - Auth', function () {
  const username = 'exampleUser';
  const password = 'examplePass';
  const fullname = 'Example User';

  before(function() {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function() {
    const exampleUser = { username, password, fullname };
    return chai.request(app)
      .post('/api/users')
      .send(exampleUser);
  });

  afterEach(function() {
    return mongoose.connection.db.dropDatabase();
  });

  after(function() {
    return mongoose.disconnect();
  });

  describe('/api/login', function() {

    it('should reject requests with no credentials', function() {
      return chai.request(app)
        .post('/api/login')
        .then((res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.name).to.equal('AuthenticationError');
          expect(res.body.message).to.equal('Bad Request');
          expect(res.body.status).to.equal(400);
        });
    });

    it('should reject requests with incorrect usernames', function() {
      const badUser = { username: 'joeschmoe', password };

      return chai.request(app)
        .post('/api/login')
        .send(badUser)
        .then(res => {
          expect(res).to.have.status(401);
          expect(res.body).to.be.an('object');
          expect(res.body.name).to.equal('AuthenticationError');
          expect(res.body.message).to.equal('Unauthorized');
          expect(res.body.status).to.equal(401);
        });
    });

    it('should reject requests with incorrect passwords', function() {
      const badUser = { username, password: 'notthepass' };

      return chai.request(app)
        .post('/api/login')
        .send(badUser)
        .then(res => {
          expect(res).to.have.status(401);
          expect(res.body).to.be.an('object');
          expect(res.body.name).to.equal('AuthenticationError');
          expect(res.body.message).to.equal('Unauthorized');
          expect(res.body.status).to.equal(401);
        });
    });

    it('should return a valid auth token', function() {
      const exampleUser = { username, password };
      let payload;

      return chai.request(app)
        .post('/api/login')
        .send(exampleUser)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.authToken).to.be.a('string');

          payload = jwt.verify(res.body.authToken, JWT_SECRET, { algorithm: ['HS256'] });
          
          return User.findOne({ username });
        })
        .then(user => {
          expect(payload.user.fullname).to.equal(user.fullname);
          expect(payload.user.username).to.equal(user.username);
          expect(payload.user.id).to.equal(user.id);
        });
    });

  });

  describe('/api/refresh', function() {

    it('should reject requests with an invalid token', function() {
      const user = { username, fullname };
      const badToken = jwt.sign({ user }, 'badsecret', {
        subject: user.username,
        expiresIn: JWT_EXPIRY
      });

      return chai.request(app)
        .post('/api/refresh')
        .set('Authorization', `Bearer ${badToken}`)
        .then(res => {
          expect(res).to.have.status(401);
          expect(res.body).to.be.an('object');
          expect(res.body.name).to.equal('AuthenticationError');
          expect(res.body.message).to.equal('Unauthorized');
          expect(res.body.status).to.equal(401);
        });
    });

    it('should reject requests with an expired token', function() {
      const exp = Math.floor(Date.now() / 1000) - 10; // => 10 seconds ago
      const user = { username, fullname };
      const expiredToken = jwt.sign({ user, exp }, JWT_SECRET, {
        subject: user.username
      });

      return chai.request(app)
        .post('/api/refresh')
        .set('Authorization', `Bearer ${expiredToken}`)
        .then(res => {
          expect(res).to.have.status(401);
          expect(res.body).to.be.an('object');
          expect(res.body.name).to.equal('AuthenticationError');
          expect(res.body.message).to.equal('Unauthorized');
          expect(res.body.status).to.equal(401);
        });
    });

    it('should return a valid token with a newer expiry date', function() {
      const user = { username, fullname };
      const goodToken = jwt.sign({ user }, JWT_SECRET, {
        subject: user.username,
        expiresIn: JWT_EXPIRY
      });
      let payload;

      return chai.request(app)
        .post('/api/refresh')
        .set('Authorization', `Bearer ${goodToken}`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.authToken).to.be.a('string');

          payload = jwt.verify(res.body.authToken, JWT_SECRET, { algorithm: ['HS256'] });
          
          return User.findOne({ username });
        })
        .then(user => {
          expect(payload.user.fullname).to.equal(user.fullname);
          expect(payload.user.username).to.equal(user.username);
        });
    });

  });

});
