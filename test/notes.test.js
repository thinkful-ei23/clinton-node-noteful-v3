'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const sinon = require('sinon');
const express = require('express');

const app = require('../server');
const { TEST_MONGODB_URI, JWT_SECRET } = require('../config');

const User = require('../models/user');
const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');

const seedUsers = require('../db/seed/users');
const seedNotes = require('../db/seed/notes');
const seedFolders = require('../db/seed/folders');
const seedTags = require('../db/seed/tags');

const sandbox = sinon.createSandbox();
const expect = chai.expect;
chai.use(chaiHttp);

describe('Noteful /api/notes resource', function() {

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  let token;
  let user;

  beforeEach(function () {
    return Promise.all([
      User.insertMany(seedUsers),
      Note.insertMany(seedNotes),
      Folder.insertMany(seedFolders),
      Tag.insertMany(seedTags),
      Folder.createIndexes(),
      Tag.createIndexes()
    ])
      .then(([users]) => {
        user = users[0];
        token = jwt.sign({ user }, JWT_SECRET, { subject: user.username });
      });
  });

  afterEach(function () {
    sandbox.restore();
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
        .set('Authorization', `Bearer ${token}`)
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.have.lengthOf.at.least(1);
          return Note.find({ userId: user.id });
        })
        .then(function(notes) {
          expect(res.body).to.have.lengthOf(notes.length);
        });
    });

    it('should return notes with right fields', function() {
      let resNote;
      return chai.request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf.at.least(1);

          res.body.forEach(function(note) {
            expect(note).to.be.an('object');
            expect(note).to.include.keys('id', 'title', 'content', 'createdAt', 'updatedAt', 'folderId', 'tags', 'userId');
          });
          resNote = res.body[0];
          return Note.findById(resNote.id)
            .populate('tags', 'name')
            .sort({ updatedAt: 'desc' });
        })
        .then(function(note) {
          expect(resNote.id).to.equal(note.id);
          expect(resNote.title).to.equal(note.title);
          expect(resNote.content).to.equal(note.content);
          expect(new Date(resNote.createdAt)).to.eql(note.createdAt);
          expect(new Date(resNote.updatedAt)).to.eql(note.updatedAt);
          expect(resNote.folderId).to.equal(note.folderId + '');
          expect(resNote.tags).to.be.an('array');
          for (let i = 0; i < resNote.tags.length; i++) {
            expect(resNote.tags[i].name).to.equal(note.tags[i].name);
            expect(resNote.tags[i].id).to.equal(note.tags[i].id);
          }
          expect(resNote.userId).to.equal(note.userId + '');
        });
    });

    it('should return correct search results for a valid query', function() {
      const searchTerm = 'government';
      let resNote;
      return chai.request(app)
        .get(`/api/notes/?searchTerm=${searchTerm}`)
        .set('Authorization', `Bearer ${token}`)
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.be.above(0);
          res.body.forEach(function(note) {
            expect(note).to.be.a('object');
            expect(note).to.have.all.keys('id', 'title', 'content', 'folderId', 'createdAt', 'updatedAt', 'tags', 'userId');
            expect(note.title).to.include(searchTerm);
          });
          resNote = res.body[0];
          const re = new RegExp(searchTerm, 'i');
          return Note.find({userId: user.id, $or: [{'title': re}, {'content': re}]})
            .populate('tags', 'name')
            .sort({ updatedAt: 'desc' });
        })
        .then(function(notes) {
          expect(resNote.id).to.equal(notes[0].id);
          expect(resNote.title).to.equal(notes[0].title);
          expect(resNote.content).to.equal(notes[0].content);
          expect(new Date(resNote.createdAt)).to.eql(notes[0].createdAt);
          expect(new Date(resNote.updatedAt)).to.eql(notes[0].updatedAt);
          expect(resNote.folderId).to.equal(notes[0].folderId + '');
          expect(resNote.tags).to.be.an('array');
          for (let i = 0; i < resNote.tags.length; i++) {
            expect(resNote.tags[i].name).to.equal(notes[0].tags[i].name);
            expect(resNote.tags[i].id).to.equal(notes[0].tags[i].id);
          }
          expect(resNote.userId).to.equal(notes[0].userId + '');
        });
    });

    it('should return correct results for a valid folderId', function() {
      const folderId = '222222222222222222222201';
      let resNote;
      return chai.request(app)
        .get(`/api/notes/?folderId=${folderId}`)
        .set('Authorization', `Bearer ${token}`)
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.be.above(0);
          res.body.forEach(function(note) {
            expect(note).to.be.a('object');
            expect(note).to.have.all.keys('id', 'title', 'content', 'folderId', 'createdAt', 'updatedAt', 'tags', 'userId');
            expect(note.folderId).to.equal(folderId);
          });
          resNote = res.body[0];
          return Note.find({userId: user.id, folderId})
            .populate('tags', 'name')
            .sort({ updatedAt: 'desc' });
        })
        .then(function(notes) {
          expect(resNote.id).to.equal(notes[0].id);
          expect(resNote.title).to.equal(notes[0].title);
          expect(resNote.content).to.equal(notes[0].content);
          expect(new Date(resNote.createdAt)).to.eql(notes[0].createdAt);
          expect(new Date(resNote.updatedAt)).to.eql(notes[0].updatedAt);
          expect(resNote.folderId).to.equal(notes[0].folderId + '');
          expect(resNote.tags).to.be.an('array');
          for (let i = 0; i < resNote.tags.length; i++) {
            expect(resNote.tags[i].name).to.equal(notes[0].tags[i].name);
            expect(resNote.tags[i].id).to.equal(notes[0].tags[i].id);
          }
          expect(resNote.userId).to.equal(notes[0].userId + '');
        });
    });

    it('should return correct results for a valid tagId', function() {
      const tagId = '333333333333333333333301';
      let resNote;
      return chai.request(app)
        .get(`/api/notes/?tagId=${tagId}`)
        .set('Authorization', `Bearer ${token}`)
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.be.above(0);
          res.body.forEach(function(note) {
            expect(note).to.be.a('object');
            expect(note).to.have.all.keys('id', 'title', 'content', 'folderId', 'createdAt', 'updatedAt', 'tags', 'userId');
          });
          resNote = res.body[0];
          return Note.find({userId: user.id, tags: tagId})
            .populate('tags', 'name')
            .sort({ updatedAt: 'desc' });
        })
        .then(function(notes) {
          expect(resNote.id).to.equal(notes[0].id);
          expect(resNote.title).to.equal(notes[0].title);
          expect(resNote.content).to.equal(notes[0].content);
          expect(new Date(resNote.createdAt)).to.eql(notes[0].createdAt);
          expect(new Date(resNote.updatedAt)).to.eql(notes[0].updatedAt);
          expect(resNote.folderId).to.equal(notes[0].folderId + '');
          expect(resNote.tags).to.be.an('array');
          for (let i = 0; i < resNote.tags.length; i++) {
            expect(resNote.tags[i].name).to.equal(notes[0].tags[i].name);
            expect(resNote.tags[i].id).to.equal(notes[0].tags[i].id);
          }
          expect(resNote.userId).to.equal(notes[0].userId + '');
        });
    });

    it('should return correct results for a valid query and folderId', function() {
      const searchTerm = 'gaga';
      const folderId = '222222222222222222222203';
      let resNote;
      return chai.request(app)
        .get(`/api/notes/?folderId=${folderId}&searchTerm=${searchTerm}`)
        .set('Authorization', `Bearer ${token}`)
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.be.above(0);
          res.body.forEach(function(note) {
            expect(note).to.be.a('object');
            expect(note).to.have.all.keys('id', 'title', 'content', 'folderId', 'createdAt', 'updatedAt', 'tags', 'userId');
            expect(note.title.toLowerCase()).to.include(searchTerm.toLowerCase());
            expect(note.folderId).to.equal(folderId);
          });
          resNote = res.body[0];
          const re = new RegExp(searchTerm, 'i');
          return Note.find({userId: user.id, $or: [{'title': re}, {'content': re}], 'folderId': folderId})
            .populate('tags', 'name')
            .sort({ updatedAt: 'desc' });
        })
        .then(function(notes) {
          expect(resNote.id).to.equal(notes[0].id);
          expect(resNote.title).to.equal(notes[0].title);
          expect(resNote.content).to.equal(notes[0].content);
          expect(new Date(resNote.createdAt)).to.eql(notes[0].createdAt);
          expect(new Date(resNote.updatedAt)).to.eql(notes[0].updatedAt);
          expect(resNote.folderId).to.equal(notes[0].folderId + '');
          expect(resNote.tags).to.be.an('array');
          for (let i = 0; i < resNote.tags.length; i++) {
            expect(resNote.tags[i].name).to.equal(notes[0].tags[i].name);
            expect(resNote.tags[i].id).to.equal(notes[0].tags[i].id);
          }
          expect(resNote.userId).to.equal(notes[0].userId + '');
        });
    });

    it('should return an empty array for an invalid query', function() {
      const searchTerm = 'dogs';
      const folderId = '222222222222222222222203';
      return chai.request(app)
        .get(`/api/notes/?folderId=${folderId}&searchTerm=${searchTerm}`)
        .set('Authorization', `Bearer ${token}`)
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.equal(0);
        });
    });

    it('should return a 500 error', function() {
      sandbox.stub(Note.schema.options.toObject, 'transform').throws('FakeError');
      return chai.request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Internal Server Error');
        });
    });

  });

  describe('GET /api/notes/:id', function() {

    it('should return the correct note', function() {
      let resNote;
      return Note.findOne({ userId: user.id })
        .populate('tags', 'name')
        .then(function(res) {
          resNote = res;
          return chai.request(app)
            .get(`/api/notes/${resNote.id}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'folderId', 'content', 'createdAt', 'updatedAt', 'tags', 'userId');

          expect(res.body.id).to.equal(resNote.id);
          expect(res.body.title).to.equal(resNote.title);
          expect(res.body.content).to.equal(resNote.content);
          expect(new Date(res.body.createdAt)).to.eql(resNote.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(resNote.updatedAt);
          expect(res.body.folderId).to.equal(resNote.folderId + '');
          expect(resNote.tags).to.be.an('array');
          for (let i = 0; i < resNote.tags.length; i++) {
            expect(resNote.tags[i].name).to.equal(resNote.tags[i].name);
            expect(resNote.tags[i].id).to.equal(resNote.tags[i].id);
          }
          expect(res.body.userId).to.equal(resNote.userId + '');
        });
    });

    it('should return a 400 error when given an invalid id', function() {
      return chai.request(app)
        .get('/api/notes/NOTANID')
        .set('Authorization', `Bearer ${token}`)
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
        .get('/api/notes/111111111111111111111199')
        .set('Authorization', `Bearer ${token}`)
        .then(function(res) {
          expect(res).to.have.status(404);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('Not Found');
        });
    });

    it('should return a 500 error', function() {
      sandbox.stub(Note.schema.options.toObject, 'transform').throws('FakeError');
      return Note.findOne({ userId: user.id })
        .populate('tags', 'name')
        .then(function(res) {
          return chai.request(app)
            .get(`/api/notes/${res.id}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Internal Server Error');
        });
    });

  });

  describe('POST /api/notes', function() {

    it('should create and return a new note when provided valid data', function() {
      const newItem = {
        'title': 'The best article about dogs ever!',
        'content': 'Lorem ipsum dolor...',
        'folderId': '222222222222222222222202',
        'tags': ['333333333333333333333301', '333333333333333333333303']
      };

      let res;
      return chai.request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res).to.have.header('location');
          expect(res.headers.location).to.include(res.body.id);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'folderId', 'createdAt', 'updatedAt', 'tags', 'userId');
          expect(res.body).to.deep.equal(
            Object.assign(newItem, ({
              id: res.body.id,
              createdAt: res.body.createdAt,
              updatedAt: res.body.updatedAt,
              userId: res.body.userId
            }))
          );
          return Note.findById(res.body.id);
        })
        .then(function(data) {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
          expect(res.body.folderId).to.equal(data.folderId + '');
          expect(res.body.tags).to.be.an('array');
          for (let i = 0; i < res.body.tags.length; i++) {
            expect(res.body.tags[i]).to.equal(data.tags[i] + '');
          }
          expect(res.body.userId).to.equal(data.userId + '');
        });
    });

    it('should create and return a new note when no folder is specified', function() {
      const newItem = {
        'title': 'The best article about dogs ever!',
        'content': 'Lorem ipsum dolor...',
        'folderId': '',
        'tags': ['333333333333333333333301', '333333333333333333333303']
      };

      let res;
      return chai.request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res).to.have.header('location');
          expect(res.headers.location).to.include(res.body.id);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'createdAt', 'updatedAt', 'tags', 'userId');
          delete newItem.folderId;
          expect(res.body).to.deep.equal(
            Object.assign(newItem, ({
              id: res.body.id,
              createdAt: res.body.createdAt,
              updatedAt: res.body.updatedAt,
              userId: res.body.userId
            }))
          );
          return Note.findById(res.body.id);
        })
        .then(function(data) {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
          expect(res.body.tags).to.be.an('array');
          for (let i = 0; i < res.body.tags.length; i++) {
            expect(res.body.tags[i]).to.equal(data.tags[i] + '');
          }
          expect(res.body.userId).to.equal(data.userId + '');
        });
    });

    it('should return a 400 error when missing a `title`', function() {
      const newNote = { title: '', content: 'Uh-oh! No title!' };

      return chai.request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newNote)
        .then(function(res) {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

    it('should return a 400 error when given an invalid folderId', function() {
      const newNote = {
        'title': 'New Title',
        'content': 'New content lorem ipsum...',
        'folderId': 'NOTANID'
      };

      return chai.request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newNote)
        .then(function(res) {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('`folderId` is not valid');
        });
    });

    it('should return a 400 error when given a nonexistent folderId', function() {
      const newNote = {
        'title': 'New Title',
        'content': 'New content lorem ipsum...',
        'folderId': '222222222222222222222299'
      };

      return chai.request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newNote)
        .then(function(res) {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('`folderId` is not valid');
        });
    });

    it('should return a 400 error when given an invalid tagId', function() {
      const newNote = {
        'title': 'Updated Title',
        'content': 'Updated content lorem ipsum...',
        'folderId': '222222222222222222222203',
        'tags': ['333333333333333333333303', 'NOTANID']
      };

      return chai.request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newNote)
        .then(function(res) {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('`tagId` is not valid');
        });
    });

    it('should return a 400 error when given a nonexistent tagId', function() {
      const newNote = {
        'title': 'Updated Title',
        'content': 'Updated content lorem ipsum...',
        'folderId': '222222222222222222222203',
        'tags': ['333333333333333333333399']
      };

      return chai.request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newNote)
        .then(function(res) {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('`tagId` is not valid');
        });
    });

    it('should return a 500 error', function() {
      sandbox.stub(Note.schema.options.toObject, 'transform').throws('FakeError');
      const newItem = {
        'title': 'The best article about dogs ever!',
        'content': 'Lorem ipsum dolor...',
        'folderId': '222222222222222222222202',
        'tags': ['333333333333333333333301', '333333333333333333333303']
      };

      return chai.request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Internal Server Error');
        });
    });

  });

  describe('PUT /api/notes/:id', function() {

    it('should update and return the note when provided valid data', function() {
      const updateData = {
        'title': 'Updated Title',
        'content': 'Updated content lorem ipsum...',
        'folderId': '222222222222222222222202',
        'tags': ['333333333333333333333301', '333333333333333333333304']
      };
      let res;

      return Note
        .findOne({ userId: user.id })
        .then(function(note) {
          updateData.id = note.id;
          return chai.request(app)
            .put(`/api/notes/${note.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateData);
        })
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'folderId', 'createdAt', 'updatedAt', 'tags', 'userId');
          expect(res.body).to.deep.equal(
            Object.assign(updateData, ({
              id: res.body.id,
              createdAt: res.body.createdAt,
              updatedAt: res.body.updatedAt,
              userId: res.body.userId
            }))
          );

          return Note.findById(updateData.id);
        })
        .then(function(data) {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
          expect(res.body.folderId).to.equal(data.folderId + '');
          expect(res.body.tags).to.be.an('array');
          for (let i = 0; i < res.body.tags.length; i++) {
            expect(res.body.tags[i]).to.equal(data.tags[i] + '');
          }
          expect(res.body.userId).to.equal(data.userId + '');
        });

    });

    it('should update and return the note when missing a folderId', function() {
      const updateData = {
        'title': 'Updated Title',
        'content': 'Updated content lorem ipsum...',
        'folderId': '',
        'tags': ['333333333333333333333301', '333333333333333333333304']
      };
      let res;

      return Note
        .findOne({ userId: user.id })
        .then(function(note) {
          updateData.id = note.id;
          return chai.request(app)
            .put(`/api/notes/${note.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateData);
        })
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'createdAt', 'updatedAt', 'tags', 'userId');
          expect(res.body).to.deep.equal({
            id: res.body.id,
            createdAt: res.body.createdAt,
            updatedAt: res.body.updatedAt,
            userId: res.body.userId,
            title: updateData.title,
            content: updateData.content,
            tags: updateData.tags
          });

          return Note.findById(updateData.id);
        })
        .then(function(data) {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
          expect(res.body.tags).to.be.an('array');
          for (let i = 0; i < res.body.tags.length; i++) {
            expect(res.body.tags[i]).to.equal(data.tags[i] + '');
          }
          expect(res.body.userId).to.equal(data.userId + '');
        });

    });

    it('should update and return the note when no tags are specified', function() {
      const updateData = {
        'title': 'Updated Title',
        'content': 'Updated content lorem ipsum...',
        'folderId': '222222222222222222222202',
        'tags': []
      };
      let res;

      return Note
        .findOne({ userId: user.id })
        .then(function(note) {
          updateData.id = note.id;
          return chai.request(app)
            .put(`/api/notes/${note.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateData);
        })
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'folderId', 'createdAt', 'updatedAt', 'tags', 'userId');
          expect(res.body).to.deep.equal(
            Object.assign(updateData, ({
              id: res.body.id,
              createdAt: res.body.createdAt,
              updatedAt: res.body.updatedAt,
              userId: res.body.userId
            }))
          );

          return Note.findById(updateData.id);
        })
        .then(function(data) {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
          expect(res.body.folderId).to.equal(data.folderId + '');
          expect(res.body.tags).to.be.an('array');
          for (let i = 0; i < res.body.tags.length; i++) {
            expect(res.body.tags[i]).to.equal(data.tags[i] + '');
          }
          expect(res.body.userId).to.equal(data.userId + '');
        });

    });

    it('should return a 400 error when missing a `title`', function() {
      const updateData = {
        'title': '',
        'content': 'Updated content lorem ipsum...',
        'folderId': '222222222222222222222202',
        'tags': ['333333333333333333333301', '333333333333333333333304']
      };

      return Note
        .findOne({ userId: user.id })
        .then(function(note) {
          updateData.id = note.id;
          return chai.request(app)
            .put(`/api/notes/${note.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

    it('should return a 400 error when `tags` are not an array', function() {
      const updateData = {
        'title': 'Updated Title',
        'content': 'Updated content lorem ipsum...',
        'folderId': '222222222222222222222202',
        'tags': '333333333333333333333301'
      };

      return Note
        .findOne({ userId: user.id })
        .then(function(note) {
          updateData.id = note.id;
          return chai.request(app)
            .put(`/api/notes/${note.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('`tags` must be an array');
        });
    });

    it('should return a 400 error when given an invalid folderId', function() {
      const updateData = {
        'title': 'Updated Title',
        'content': 'Updated content lorem ipsum...',
        'folderId': 'NOTANID',
        'tags': ['333333333333333333333301', '333333333333333333333304']
      };

      return Note
        .findOne({ userId: user.id })
        .then(function(note) {
          updateData.id = note.id;
          return chai.request(app)
            .put(`/api/notes/${note.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('`folderId` is not valid');
        });
    });

    it('should return a 400 error when given a nonexistent folderId', function() {
      const updateData = {
        'title': 'Updated Title',
        'content': 'Updated content lorem ipsum...',
        'folderId': '222222222222222222222299',
        'tags': ['333333333333333333333301', '333333333333333333333304']
      };

      return Note
        .findOne({ userId: user.id })
        .then(function(note) {
          updateData.id = note.id;
          return chai.request(app)
            .put(`/api/notes/${note.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('`folderId` is not valid');
        });
    });

    it('should return a 400 error when given an invalid tagId', function() {
      const updateData = {
        'title': 'Updated Title',
        'content': 'Updated content lorem ipsum...',
        'folderId': '222222222222222222222202',
        'tags': ['333333333333333333333301', 'NOTANID']
      };

      return Note
        .findOne({ userId: user.id })
        .then(function(note) {
          updateData.id = note.id;
          return chai.request(app)
            .put(`/api/notes/${note.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('`tagId` is not valid');
        });
    });

    it('should return a 400 error when given a nonexistent tagId', function() {
      const updateData = {
        'title': 'Updated Title',
        'content': 'Updated content lorem ipsum...',
        'folderId': '222222222222222222222202',
        'tags': ['333333333333333333333301', '333333333333333333333399']
      };

      return Note
        .findOne({ userId: user.id })
        .then(function(note) {
          updateData.id = note.id;
          return chai.request(app)
            .put(`/api/notes/${note.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('`tagId` is not valid');
        });
    });

    it('should return a 400 error when given an invalid id', function() {
      const updateData = {
        'title': 'Updated Title',
        'content': 'Updated content lorem ipsum...',
        'folderId': '222222222222222222222202',
        'tags': ['333333333333333333333301', '333333333333333333333304']
      };

      return chai.request(app)
        .put('/api/notes/NOTANID')
        .set('Authorization', `Bearer ${token}`)
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
      const updateData = {
        'title': 'Updated Title',
        'content': 'Updated content lorem ipsum...',
        'folderId': '222222222222222222222202',
        'tags': ['333333333333333333333301', '333333333333333333333304']
      };
      
      return chai.request(app)
        .put('/api/notes/111111111111111111111199')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .then(function(res) {
          expect(res).to.have.status(404);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('Not Found');
        });
    });

    it('should return a 500 error', function() {
      sandbox.stub(Note.schema.options.toObject, 'transform').throws('FakeError');
      const updateData = {
        'title': 'Updated Title',
        'content': 'Updated content lorem ipsum...',
        'folderId': '222222222222222222222202',
        'tags': ['333333333333333333333301', '333333333333333333333304']
      };

      return Note
        .findOne({ userId: user.id })
        .then(function(note) {
          updateData.id = note.id;
          return chai.request(app)
            .put(`/api/notes/${note.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateData);
        })
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Internal Server Error');
        });
    });

  });

  describe('DELETE /api/notes/:id', function() {

    it('should delete a note by id', function() {
      let note;

      return Note
        .findOne({ userId: user.id })
        .then(function(_note) {
          note = _note;
          return chai.request(app)
            .delete(`/api/notes/${note.id}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return Note.findById(note.id);
        })
        .then(function(_note) {
          expect(_note).to.be.null;
        });
    });

    it('should return a 400 error when given an invalid id', function() {
      return chai.request(app)
        .delete('/api/notes/NOTANID')
        .set('Authorization', `Bearer ${token}`)
        .then(function(res) {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('Invalid id');
        });
    });

    it('should return a 500 error', function() {
      sandbox.stub(express.response, 'sendStatus').throws('FakeError');
      return Note
        .findOne({ userId: user.id })
        .then(function(note) {
          return chai.request(app)
            .delete(`/api/notes/${note.id}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Internal Server Error');
        });
    });

  });

});
