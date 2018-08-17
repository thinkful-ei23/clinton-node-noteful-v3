// 'use strict';

// const chai = require('chai');
// const chaiHttp = require('chai-http');
// const mongoose = require('mongoose');

// const app = require('../server');
// const { TEST_MONGODB_URI } = require('../config');

// const Note = require('../models/note');
// const Folder = require('../models/folder');

// const seedNotes = require('../db/seed/notes');
// const seedFolders = require('../db/seed/folders');

// const expect = chai.expect;
// chai.use(chaiHttp);

// describe('Noteful /api/notes resource', function() {

//   before(function () {
//     return mongoose.connect(TEST_MONGODB_URI)
//       .then(() => mongoose.connection.db.dropDatabase());
//   });

//   beforeEach(function () {
//     return Promise.all([
//       Note.insertMany(seedNotes),
//       Folder.insertMany(seedFolders),
//       Folder.createIndexes()
//     ]);
//   });

//   afterEach(function () {
//     return mongoose.connection.db.dropDatabase();
//   });

//   after(function () {
//     return mongoose.disconnect();
//   });

//   describe('GET /api/notes', function() {

//     it('should return all existing notes', function() {
//       let res;
//       return chai.request(app)
//         .get('/api/notes')
//         .then(function(_res) {
//           res = _res;
//           expect(res).to.have.status(200);
//           expect(res).to.be.json;
//           expect(res.body).to.have.lengthOf.at.least(1);
//           return Note.countDocuments();
//         })
//         .then(function(count) {
//           expect(res.body).to.have.lengthOf(count);
//         });
//     });

//     it('should return notes with right fields', function() {
//       let resNote;
//       return chai.request(app)
//         .get('/api/notes')
//         .then(function(res) {
//           expect(res).to.have.status(200);
//           expect(res).to.be.json;
//           expect(res.body).to.be.an('array');
//           expect(res.body).to.have.lengthOf.at.least(1);

//           res.body.forEach(function(note) {
//             expect(note).to.be.an('object');
//             expect(note).to.include.keys('id', 'title', 'content', 'createdAt', 'updatedAt', 'folderId');
//           });
//           resNote = res.body[0];
//           return Note.findById(resNote.id);
//         })
//         .then(function(note) {
//           expect(resNote.id).to.equal(note.id);
//           expect(resNote.title).to.equal(note.title);
//           expect(resNote.content).to.equal(note.content);
//           expect(new Date(resNote.createdAt)).to.eql(note.createdAt);
//           expect(new Date(resNote.updatedAt)).to.eql(note.updatedAt);
//           expect(resNote.folderId).to.equal(note.folderId + '');
//         });
//     });

//     it('should return correct search results for a valid query', function() {
//       const searchTerm = 'government';
//       let resNote;
//       return chai.request(app)
//         .get(`/api/notes/?searchTerm=${searchTerm}`)
//         .then(function(res) {
//           expect(res).to.have.status(200);
//           expect(res).to.be.json;
//           expect(res.body).to.be.an('array');
//           expect(res.body.length).to.be.above(0);
//           res.body.forEach(function(note) {
//             expect(note).to.be.a('object');
//             expect(note).to.have.all.keys('id', 'title', 'content', 'folderId', 'createdAt', 'updatedAt');
//             expect(note.title).to.include(searchTerm);
//           });
//           resNote = res.body[0];
//           const re = new RegExp(searchTerm, 'i');
//           return Note.find({$or: [{'title': re}, {'content': re}]});
//         })
//         .then(function(notes) {
//           expect(resNote.id).to.equal(notes[0].id);
//           expect(resNote.title).to.equal(notes[0].title);
//           expect(resNote.content).to.equal(notes[0].content);
//           expect(new Date(resNote.createdAt)).to.eql(notes[0].createdAt);
//           expect(new Date(resNote.updatedAt)).to.eql(notes[0].updatedAt);
//           expect(resNote.folderId).to.equal(notes[0].folderId + '');
//         });
//     });

//     it('should return correct results for a valid folderId', function() {
//       const folderId = '111111111111111111111101';
//       let resNote;
//       return chai.request(app)
//         .get(`/api/notes/?folderId=${folderId}`)
//         .then(function(res) {
//           expect(res).to.have.status(200);
//           expect(res).to.be.json;
//           expect(res.body).to.be.an('array');
//           expect(res.body.length).to.be.above(0);
//           res.body.forEach(function(note) {
//             expect(note).to.be.a('object');
//             expect(note).to.have.all.keys('id', 'title', 'content', 'folderId', 'createdAt', 'updatedAt');
//             expect(note.folderId).to.equal(folderId);
//           });
//           resNote = res.body[0];
//           return Note.find({'folderId': folderId});
//         })
//         .then(function(notes) {
//           expect(resNote.id).to.equal(notes[0].id);
//           expect(resNote.title).to.equal(notes[0].title);
//           expect(resNote.content).to.equal(notes[0].content);
//           expect(new Date(resNote.createdAt)).to.eql(notes[0].createdAt);
//           expect(new Date(resNote.updatedAt)).to.eql(notes[0].updatedAt);
//           expect(resNote.folderId).to.equal(notes[0].folderId + '');
//         });
//     });

//     it('should return correct results for a valid query and folderId', function() {
//       const searchTerm = 'gaga';
//       const folderId = '111111111111111111111101';
//       let resNote;
//       return chai.request(app)
//         .get(`/api/notes/?folderId=${folderId}&searchTerm=${searchTerm}`)
//         .then(function(res) {
//           expect(res).to.have.status(200);
//           expect(res).to.be.json;
//           expect(res.body).to.be.an('array');
//           expect(res.body.length).to.be.above(0);
//           res.body.forEach(function(note) {
//             expect(note).to.be.a('object');
//             expect(note).to.have.all.keys('id', 'title', 'content', 'folderId', 'createdAt', 'updatedAt');
//             expect(note.title.toLowerCase()).to.include(searchTerm.toLowerCase());
//             expect(note.folderId).to.equal(folderId);
//           });
//           resNote = res.body[0];
//           const re = new RegExp(searchTerm, 'i');
//           return Note.find({$or: [{'title': re}, {'content': re}], 'folderId': folderId});
//         })
//         .then(function(notes) {
//           expect(resNote.id).to.equal(notes[0].id);
//           expect(resNote.title).to.equal(notes[0].title);
//           expect(resNote.content).to.equal(notes[0].content);
//           expect(new Date(resNote.createdAt)).to.eql(notes[0].createdAt);
//           expect(new Date(resNote.updatedAt)).to.eql(notes[0].updatedAt);
//           expect(resNote.folderId).to.equal(notes[0].folderId + '');
//         });
//     });

//     it('should return an empty array for an invalid query', function() {
//       const searchTerm = 'dogs';
//       const folderId = '111111111111111111111105';
//       return chai.request(app)
//         .get(`/api/notes/?folderId=${folderId}&searchTerm=${searchTerm}`)
//         .then(function(res) {
//           expect(res).to.have.status(200);
//           expect(res).to.be.json;
//           expect(res.body).to.be.an('array');
//           expect(res.body.length).to.equal(0);
//         });
//     });

//   });

//   describe('GET /api/notes/:id', function() {

//     it('should return the correct note', function() {
//       let resNote;
//       return Note.findOne()
//         .then(function(res) {
//           resNote = res;
//           return chai.request(app).get(`/api/notes/${resNote.id}`);
//         })
//         .then(function(res) {
//           expect(res).to.have.status(200);
//           expect(res).to.be.json;

//           expect(res.body).to.be.an('object');
//           expect(res.body).to.have.keys('id', 'title', 'folderId', 'content', 'createdAt', 'updatedAt');

//           expect(res.body.id).to.equal(resNote.id);
//           expect(res.body.title).to.equal(resNote.title);
//           expect(res.body.content).to.equal(resNote.content);
//           expect(new Date(res.body.createdAt)).to.eql(resNote.createdAt);
//           expect(new Date(res.body.updatedAt)).to.eql(resNote.updatedAt);
//           expect(res.body.folderId).to.equal(resNote.folderId + '');
//         });
//     });

//     it('should return a 400 error when given an invalid id', function() {
//       return chai.request(app)
//         .get('/api/notes/NOTANID')
//         .then(function(res) {
//           expect(res).to.have.status(400);
//           expect(res).to.be.json;
//           expect(res.body).to.be.an('object');
//           expect(res.body).to.include.keys('message', 'status');
//           expect(res.body.message).to.equal('Invalid id');
//         });
//     });

//     it('should return a 404 error when given a nonexistent id', function() {
//       return chai.request(app)
//         .get('/api/notes/000000000000000000000099')
//         .then(function(res) {
//           expect(res).to.have.status(404);
//           expect(res).to.be.json;
//           expect(res.body).to.be.an('object');
//           expect(res.body).to.include.keys('message', 'status');
//           expect(res.body.message).to.equal('Not Found');
//         });
//     });

//   });

//   describe('POST /api/notes', function() {

//     it('should create and return a new note when provided valid data', function() {
//       const newItem = {
//         'title': 'The best article about dogs ever!',
//         'content': 'Lorem ipsum dolor...',
//         'folderId': '111111111111111111111100'
//       };

//       let res;
//       return chai.request(app)
//         .post('/api/notes')
//         .send(newItem)
//         .then(function(_res) {
//           res = _res;
//           expect(res).to.have.status(201);
//           expect(res).to.be.json;
//           expect(res).to.have.header('location');
//           expect(res.headers.location).to.include(res.body.id);
//           expect(res.body).to.be.an('object');
//           expect(res.body).to.have.keys('id', 'title', 'content', 'folderId', 'createdAt', 'updatedAt');
//           expect(res.body).to.deep.equal(
//             Object.assign(newItem, ({
//               id: res.body.id,
//               createdAt: res.body.createdAt,
//               updatedAt: res.body.updatedAt
//             }))
//           );
//           return Note.findById(res.body.id);
//         })
//         .then(function(data) {
//           expect(res.body.id).to.equal(data.id);
//           expect(res.body.title).to.equal(data.title);
//           expect(res.body.content).to.equal(data.content);
//           expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
//           expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
//           expect(res.body.folderId).to.equal(data.folderId + '');
//         });
//     });

//     it('should return a 400 error when missing a `title`', function() {
//       const newNote = { title: '', content: 'Uh-oh! No title!' };

//       return chai.request(app)
//         .post('/api/notes')
//         .send(newNote)
//         .then(function(res) {
//           expect(res).to.have.status(400);
//           expect(res).to.be.json;
//           expect(res.body).to.be.an('object');
//           expect(res.body).to.include.keys('message', 'status');
//           expect(res.body.message).to.equal('Missing `title` in request body');
//         });
//     });

//     it('should return a 400 error when given an invalid folderId', function() {
//       const newNote = {
//         'title': 'Updated Title',
//         'content': 'Updated content lorem ipsum...',
//         'folderId': 'NOTANID'
//       };

//       return chai.request(app)
//         .post('/api/notes')
//         .send(newNote)
//         .then(function(res) {
//           expect(res).to.have.status(400);
//           expect(res).to.be.json;
//           expect(res.body).to.be.an('object');
//           expect(res.body).to.include.keys('message', 'status');
//           expect(res.body.message).to.equal('`folderId` is not a valid Mongo ObjectId');
//         });
//     });

//   });

//   describe('PUT /api/notes/:id', function() {

//     it('should update and return the note when provided valid data', function() {
//       const updateData = {
//         'title': 'Updated Title',
//         'content': 'Updated content lorem ipsum...',
//         'folderId': '111111111111111111111100'
//       };
//       let res;

//       return Note
//         .findOne()
//         .then(function(note) {
//           updateData.id = note.id;
//           return chai.request(app)
//             .put(`/api/notes/${note.id}`)
//             .send(updateData);
//         })
//         .then(function(_res) {
//           res = _res;
//           expect(res).to.have.status(200);
//           expect(res).to.be.json;
//           expect(res.body).to.be.an('object');
//           expect(res.body).to.have.keys('id', 'title', 'content', 'folderId', 'createdAt', 'updatedAt');
//           expect(res.body).to.deep.equal(
//             Object.assign(updateData, ({
//               id: res.body.id,
//               createdAt: res.body.createdAt,
//               updatedAt: res.body.updatedAt
//             }))
//           );

//           return Note.findById(updateData.id);
//         })
//         .then(function(data) {
//           expect(res.body.id).to.equal(data.id);
//           expect(res.body.title).to.equal(data.title);
//           expect(res.body.content).to.equal(data.content);
//           expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
//           expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
//           expect(res.body.folderId).to.equal(data.folderId + '');
//         });

//     });

//     it('should return a 400 error when missing a `title`', function() {
//       const updateData = {
//         'title': '',
//         'content': 'Updated content lorem ipsum...',
//         'folderId': '111111111111111111111100'
//       };

//       return Note
//         .findOne()
//         .then(function(note) {
//           updateData.id = note.id;
//           return chai.request(app)
//             .put(`/api/notes/${note.id}`)
//             .send(updateData);
//         })
//         .then(function(res) {
//           expect(res).to.have.status(400);
//           expect(res).to.be.json;
//           expect(res.body).to.be.an('object');
//           expect(res.body).to.include.keys('message', 'status');
//           expect(res.body.message).to.equal('Missing `title` in request body');
//         });
//     });

//     it('should return a 400 error when given an invalid folderId', function() {
//       const updateData = {
//         'title': 'Updated Title',
//         'content': 'Updated content lorem ipsum...',
//         'folderId': 'NOTANID'
//       };

//       return Note
//         .findOne()
//         .then(function(note) {
//           updateData.id = note.id;
//           return chai.request(app)
//             .put(`/api/notes/${note.id}`)
//             .send(updateData);
//         })
//         .then(function(res) {
//           expect(res).to.have.status(400);
//           expect(res).to.be.json;
//           expect(res.body).to.be.an('object');
//           expect(res.body).to.include.keys('message', 'status');
//           expect(res.body.message).to.equal('`folderId` is not a valid Mongo ObjectId');
//         });
//     });

//     it('should return a 400 error when given an invalid id', function() {
//       const updateData = {
//         'title': 'Updated Title',
//         'content': 'Updated content lorem ipsum...',
//         'folderId': '111111111111111111111100'
//       };

//       return chai.request(app)
//         .put('/api/notes/NOTANID')
//         .send(updateData)
//         .then(function(res) {
//           expect(res).to.have.status(400);
//           expect(res).to.be.json;
//           expect(res.body).to.be.an('object');
//           expect(res.body).to.include.keys('message', 'status');
//           expect(res.body.message).to.equal('Invalid id');
//         });
//     });

//     it('should return a 404 error when given a nonexistent id', function() {
//       const updateData = {
//         'title': 'Updated Title',
//         'content': 'Updated content lorem ipsum...',
//         'folderId': '111111111111111111111100'
//       };
      
//       return chai.request(app)
//         .put('/api/notes/000000000000000000000099')
//         .send(updateData)
//         .then(function(res) {
//           expect(res).to.have.status(404);
//           expect(res).to.be.json;
//           expect(res.body).to.be.an('object');
//           expect(res.body).to.include.keys('message', 'status');
//           expect(res.body.message).to.equal('Not Found');
//         });
//     });

//   });

//   describe('DELETE /api/notes/:id', function() {

//     it('should delete a note by id', function() {
//       let note;

//       return Note
//         .findOne()
//         .then(function(_note) {
//           note = _note;
//           return chai.request(app).delete(`/api/notes/${note.id}`);
//         })
//         .then(function(res) {
//           expect(res).to.have.status(204);
//           return Note.findById(note.id);
//         })
//         .then(function(_note) {
//           expect(_note).to.be.null;
//         });
//     });

//     it('should return a 400 error when given an invalid id', function() {
//       return chai.request(app)
//         .delete('/api/notes/NOTANID')
//         .then(function(res) {
//           expect(res).to.have.status(400);
//           expect(res).to.be.json;
//           expect(res.body).to.be.an('object');
//           expect(res.body).to.include.keys('message', 'status');
//           expect(res.body.message).to.equal('Invalid id');
//         });
//     });

//   });

// });
