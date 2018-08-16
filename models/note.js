'use strict';

const mongoose = require('mongoose');

// This is our schema to represent a note
const noteSchema = new mongoose.Schema({
  // The `title` property is a String type and required
  title: { type: String, required: true },
  // The `content` property is a String type
  content: String,
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' }
});

// Add `createdAt` and `updatedAt` fields
noteSchema.set('timestamps', true);

// Convert `_id` to `id` and remove `__v`
noteSchema.set('toObject', {
  virtuals: true,       // include built-in virtual `id`
  versionKey: false,    // remove `__v` version key
  transform: (doc, ret) => {
    delete ret._id;     // delete `_id`
  }
});

module.exports = mongoose.model('Note', noteSchema);
