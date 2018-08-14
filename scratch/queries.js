// mongo noteful < ./scratch/queries.js

/* eslint-disable quotes, strict */

const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

const Note = require('../models/note');

// Find/Search for notes using `Note.find`
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     const searchTerm = 'Lady Gaga';
//     let filter = {};

//     if (searchTerm) {
//       filter.title = { $regex: searchTerm, $options: 'i' };
//     }

//     return Note.find(filter).sort({ updatedAt: 'desc' });
//   })
//   .then(results => {
//     console.log(results);
//   })
//   .then(() => {
//     return mongoose.disconnect();
//   })
//   .catch(err => {
//     console.error(`ERROR: ${err.message}`);
//     console.error(err);
//   });

// Find note by id using `Note.findById`
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     const id = "000000000000000000000005";
//     return Note.findById(id);
//   })
//   .then(results => {
//     console.log(results);
//   })
//   .then(() => {
//     return mongoose.disconnect();
//   })
//   .catch(err => {
//     console.error(`ERROR: ${err.message}`);
//     console.error(err);
//   });

// Create a new note using `Note.create`
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     const noteObj = {
//       title: "Article about dogs",
//       content: "Lorem ipsum..."
//     };
//     return Note.create(noteObj);
//   })
//   .then(results => {
//     console.log(results);
//   })
//   .then(() => {
//     return mongoose.disconnect();
//   })
//   .catch(err => {
//     console.error(`ERROR: ${err.message}`);
//     console.error(err);
//   });

// Update a note by id using `Note.findByIdAndUpdate`
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     const id = "5b732c145c5aca0e7a615bb8";
//     const updateObj = {
//       title: "Updated Title",
//       content: "Updated content..."
//     };
//     return Note.findByIdAndUpdate(id, {$set: updateObj}, { new: true });
//   })
//   .then(results => {
//     console.log(results);
//   })
//   .then(() => {
//     return mongoose.disconnect();
//   })
//   .catch(err => {
//     console.error(`ERROR: ${err.message}`);
//     console.error(err);
//   });

// Delete a note by id using `Note.findByIdAndRemove`
mongoose.connect(MONGODB_URI)
  .then(() => {
    const id = "5b732c145c5aca0e7a615bb8";

    return Note.findByIdAndRemove(id);
  })
  .then(() => {
    console.log('Note deleted');
  })
  .then(() => {
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });
