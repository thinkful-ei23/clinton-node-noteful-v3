'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');

const expect = chai.expect;

chai.use(chaiHttp);

describe.only('Noteful API - Auth', function () {
  before();
  beforeEach();
  afterEach();
  after();

  describe('/api/login', function() {

    it('should reject requests with no credentials');

    it('should reject requests with incorrect usernames');

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
