'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Note = require('../models/note');
const Folder = require('../models/folder');

const seedNotes = require('../db/seed/notes');
const seedFolders = require('../db/seed/folders');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Noteful /api/notes resource', function() {

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return Promise.all([
      Note.insertMany(seedNotes),
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

  describe('GET /api/notes', function() {

    it('should return all existing notes', function() {
      let res;
      return chai.request(app)
        .get('/api/notes')
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.have.lengthOf.at.least(1);
          return Note.countDocuments();
        })
        .then(function(count) {
          expect(res.body).to.have.lengthOf(count);
        });
    });

    it('should return notes with right fields', function() {
      let resNote;
      return chai.request(app)
        .get('/api/notes')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf.at.least(1);

          res.body.forEach(function(note) {
            expect(note).to.be.an('object');
            expect(note).to.include.keys('id', 'title', 'content', 'createdAt', 'updatedAt', 'folderId');
          });
          resNote = res.body[0];
          return Note.findById(resNote.id);
        })
        .then(function(note) {
          expect(resNote.id).to.equal(note.id);
          expect(resNote.title).to.equal(note.title);
          expect(resNote.content).to.equal(note.content);
          expect(new Date(resNote.createdAt)).to.eql(note.createdAt);
          expect(new Date(resNote.updatedAt)).to.eql(note.updatedAt);
          expect(resNote.folderId).to.equal(note.folderId + '');
        });
    });

  });

  describe('GET /api/notes/:id', function() {

    it('should return the correct note', function() {
      let resNote;
      return Note.findOne()
        .then(function(res) {
          resNote = res;
          return chai.request(app).get(`/api/notes/${resNote.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'folderId', 'content', 'createdAt', 'updatedAt');

          expect(res.body.id).to.equal(resNote.id);
          expect(res.body.title).to.equal(resNote.title);
          expect(res.body.content).to.equal(resNote.content);
          expect(new Date(res.body.createdAt)).to.eql(resNote.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(resNote.updatedAt);
          expect(res.body.folderId).to.equal(resNote.folderId + '');
        });
    });

  });

  describe('POST /api/notes', function() {

    it('should create and return a new note when provided valid data', function() {
      const newItem = {
        'title': 'The best article about dogs ever!',
        'content': 'Lorem ipsum dolor...',
        'folderId': '111111111111111111111100'
      };

      let res;
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'folderId', 'createdAt', 'updatedAt');

          return Note.findById(res.body.id);
        })
        .then(function(data) {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
          expect(res.body.folderId).to.equal(data.folderId + '');
        });
    });

  });

  describe('PUT /api/notes/:id', function() {

    it('should update the note when provided valid data', function() {
      const updateData = {
        'title': 'Updated Title',
        'content': 'Updated content lorem ipsum...',
        'folderId': '111111111111111111111100'
      };

      return Note
        .findOne()
        .then(function(note) {
          updateData.id = note.id;

          return chai.request(app)
            .put(`/api/notes/${note.id}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'folderId', 'createdAt', 'updatedAt');

          return Note.findById(updateData.id);
        })
        .then(function(note) {
          expect(note.title).to.equal(updateData.title);
          expect(note.content).to.equal(updateData.content);
          expect(note.folderId + '').to.equal(updateData.folderId);
        });

    });

  });

  describe('DELETE /api/notes/:id', function() {

    it('should delete a note by id', function() {
      let note;

      return Note
        .findOne()
        .then(function(_note) {
          note = _note;
          return chai.request(app).delete(`/api/notes/${note.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return Note.findById(note.id);
        })
        .then(function(_note) {
          expect(_note).to.be.null;
        });
    });

  });

});
