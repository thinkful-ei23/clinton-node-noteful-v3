'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Tag = require('../models/tag');
const seedTags = require('../db/seed/tags');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Noteful /api/tags resource', function() {

  before(function() {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function() {
    return Promise.all([
      Tag.insertMany(seedTags),
      Tag.createIndexes()
    ]);
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /api/tags', function() {

    it('should return all existing tags', function(){
      let res;
      return chai.request(app)
        .get('/api/tags')
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.have.lengthOf.at.least(1);
          return Tag.countDocuments();
        })
        .then(function(count) {
          expect(res.body).to.have.lengthOf(count);
        });
    });

    it('should return tags with right fields', function() {
      let resTag;
      return chai.request(app)
        .get('/api/tags')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf.at.least(1);

          res.body.forEach(function(tag) {
            expect(tag).to.be.an('object');
            expect(tag).to.include.keys('id', 'name', 'createdAt', 'updatedAt');
          });
          resTag = res.body[0];
          return Tag.findById(resTag.id);
        })
        .then(function(tag) {
          expect(resTag.id).to.equal(tag.id);
          expect(resTag.name).to.equal(tag.name);
          expect(new Date(resTag.createdAt)).to.eql(tag.createdAt);
          expect(new Date(resTag.updatedAt)).to.eql(tag.updatedAt);
        });
    });

  });

  describe('GET /api/tags/:id', function() {

    it('should return the correct tag', function() {
      let resTag;
      return Tag.findOne()
        .then(function(res) {
          resTag = res;
          return chai.request(app).get(`/api/tags/${resTag.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(resTag.id);
          expect(res.body.name).to.equal(resTag.name);
          expect(new Date(res.body.createdAt)).to.eql(resTag.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(resTag.updatedAt);
        });
    });

    it('should return a 400 error when given an invalid id', function() {
      return chai.request(app)
        .get('/api/tags/NOTANID')
        .then(function(res) {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('Invalid id');
        });
    });

    it('should return a 404 error when given a nonexistent id', function() {
      return chai.request(app)
        .get('/api/tags/222222222222222222222299')
        .then(function(res) {
          expect(res).to.have.status(404);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('Not Found');
        });
    });

  });

});
