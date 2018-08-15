'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Note = require('../models/note');

const seedNotes = require('../db/seed/notes');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Noteful API resource', function() {

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return Note.insertMany(seedNotes);
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
            expect(note).to.include.keys('id', 'title', 'content', 'createdAt', 'updatedAt');
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
          expect(res.body).to.have.keys('id', 'title', 'content', 'createdAt', 'updatedAt');

          expect(res.body.id).to.equal(resNote.id);
          expect(res.body.title).to.equal(resNote.title);
          expect(res.body.content).to.equal(resNote.content);
          expect(new Date(res.body.createdAt)).to.eql(resNote.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(resNote.updatedAt);
        });
    });

  });

});
