'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const expect = chai.expect;

chai.use(chaiHttp);

describe.only('Noteful API - Auth', function () {
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

    it('should reject requests with incorrect passwords');

    it('should return a valid auth token');

  });

  describe('/api/refresh', function() {

    it('should reject requests with no credentials');

    it('should reject requests with an invalid token');

    it('should reject requests with an expired token');

    it('should return a valid token with a newer expiry date');

  });

});
