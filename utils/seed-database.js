// node ./utils/seed-database.js

'use strict';

const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');
const User = require('../models/user');

const seedNotes = require('../db/seed/notes');
const seedFolders = require('../db/seed/folders');
const seedTags = require('../db/seed/tags');
const seedUsers = require('../db/seed/users');

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.info('Dropping Database');
    return mongoose.connection.db.dropDatabase();
  })
  .then(() => {
    console.info('Seeding Database');
    return Promise.all([
      Note.insertMany(seedNotes),

      Folder.insertMany(seedFolders),
      Folder.createIndexes(),

      Tag.insertMany(seedTags),
      Tag.createIndexes(),

      User.insertMany(seedUsers),
      User.createIndexes()
    ]);
  })
  .then(() => {
    console.info('Disconnecting');
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
    db.disconnect();
  });
