'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Folder = require('../models/folder');

const seedFolders = require('../db/seed/folders');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Noteful /api/folders resource', function() {

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return Folder.insertMany(seedFolders);
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /api/folders', function() {

    it('should return all existing folders', function() {
      let res;
      return chai.request(app)
        .get('/api/folders')
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.have.lengthOf.at.least(1);
          return Folder.countDocuments();
        })
        .then(function(count) {
          expect(res.body).to.have.lengthOf(count);
        });
    });

    it('should return folders with right fields', function() {
      let resFolder;
      return chai.request(app)
        .get('/api/folders')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf.at.least(1);

          res.body.forEach(function(folder) {
            expect(folder).to.be.an('object');
            expect(folder).to.include.keys('id', 'name', 'createdAt', 'updatedAt');
          });
          resFolder = res.body[0];
          return Folder.findById(resFolder.id);
        })
        .then(function(note) {
          expect(resFolder.id).to.equal(note.id);
          expect(resFolder.name).to.equal(note.name);
          expect(new Date(resFolder.createdAt)).to.eql(note.createdAt);
          expect(new Date(resFolder.updatedAt)).to.eql(note.updatedAt);
        });
    });

  });

  describe('GET /api/folders/:id', function() {

    it('should return the correct folder', function() {
      let resFolder;
      return Folder.findOne()
        .then(function(res) {
          resFolder = res;
          return chai.request(app).get(`/api/folders/${resFolder.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');

          expect(res.body.id).to.equal(resFolder.id);
          expect(res.body.name).to.equal(resFolder.name);
          expect(new Date(res.body.createdAt)).to.eql(resFolder.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(resFolder.updatedAt);
        });
    });

  });

  describe('POST /api/folders', function() {

    it('should create and return a new folder when provided valid data', function() {
      const newFolder = {
        'name': 'Stuff'
      };

      let res;
      return chai.request(app)
        .post('/api/folders')
        .send(newFolder)
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');

          return Folder.findById(res.body.id);
        })
        .then(function(data) {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

  });

  describe('PUT /api/folders/:id', function() {

    it('should update the folder when provided valid data', function() {
      const updateData = {
        name: 'Updated Name'
      };

      return Folder
        .findOne()
        .then(function(folder) {
          updateData.id = folder.id;

          return chai.request(app)
            .put(`/api/folders/${folder.id}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');

          return Folder.findById(updateData.id);
        })
        .then(function(folder) {
          expect(folder.name).to.equal(updateData.name);
        });

    });

  });

  describe('DELETE /api/folders/:id', function() {

    it('should delete a folder by id', function() {
      let folder;

      return Folder
        .findOne()
        .then(function(_folder) {
          folder = _folder;
          return chai.request(app).delete(`/api/folders/${folder.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return Folder.findById(folder.id);
        })
        .then(function(_folder) {
          expect(_folder).to.be.null;
        });
    });

  });

});
