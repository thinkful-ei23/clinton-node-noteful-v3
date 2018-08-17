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
    return Promise.all([
      Folder.insertMany(seedFolders),
      Folder.createIndexes()
    ]);
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
        .then(function(folder) {
          expect(resFolder.id).to.equal(folder.id);
          expect(resFolder.name).to.equal(folder.name);
          expect(new Date(resFolder.createdAt)).to.eql(folder.createdAt);
          expect(new Date(resFolder.updatedAt)).to.eql(folder.updatedAt);
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

    it('should return a 400 error when given an invalid id', function() {
      return chai.request(app)
        .get('/api/folders/NOTANID')
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
        .get('/api/folders/000000000000000000000099')
        .then(function(res) {
          expect(res).to.have.status(404);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('Not Found');
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

    it('should return a 400 error when missing a `name`', function() {
      const newFolder = { name: '' };

      return chai.request(app)
        .post('/api/folders')
        .send(newFolder)
        .then(function(res) {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });

    it('should return a 400 error when given a duplicate name', function () {
      return Folder.findOne()
        .then(data => {
          const newItem = { 'name': data.name };
          return chai.request(app).post('/api/folders').send(newItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('The folder name already exists');
        });
    });

  });

  describe('PUT /api/folders/:id', function() {

    it('should update the folder when provided valid data', function() {
      const updateData = { name: 'Updated Name' };

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

    it('should return a 400 error when missing a `name`', function() {
      const updateData = { name: '' };

      return Folder
        .findOne()
        .then(function(folder) {
          updateData.id = folder.id;
          return chai.request(app)
            .put(`/api/folders/${folder.id}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });

    it('should return a 400 error when given a duplicate name', function () {
      return Folder.find().limit(2)
        .then(results => {
          const [item1, item2] = results;
          item1.name = item2.name;
          return chai.request(app)
            .put(`/api/folders/${item1.id}`)
            .send(item1);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('The folder name already exists');
        });
    });

    it('should return a 400 error when given an invalid id', function() {
      const updateData = { name: 'Updated Name' };

      return chai.request(app)
        .put('/api/folders/NOTANID')
        .send(updateData)
        .then(function(res) {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('Invalid id');
        });
    });

    it('should return a 404 error when given a nonexistent id', function() {
      const updateData = { name: 'Updated Name' };
      
      return chai.request(app)
        .put('/api/folders/111111111111111111111199')
        .send(updateData)
        .then(function(res) {
          expect(res).to.have.status(404);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('Not Found');
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

    it('should return a 400 error when given an invalid id', function() {
      return chai.request(app)
        .delete('/api/folders/NOTANID')
        .then(function(res) {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('Invalid id');
        });
    });

  });

});
