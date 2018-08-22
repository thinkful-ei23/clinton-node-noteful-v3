'use strict';

const express = require('express');
const passport = require('passport');
const ObjectId = require('mongoose').Types.ObjectId;

const Note = require('../models/note');

// Create a router instance (aka "mini-app")
const router = express.Router();

router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

/* ========== GET/READ ALL NOTES + SEARCH BY QUERY ========== */
router.get('/', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;
  let filter = {};

  if (searchTerm) {
    // V2:
    // const re = new RegExp(searchTerm, 'i');
    // filter = {$or: [{'title': re}, {'content': re}]};

    // V3:
    const re = new RegExp(searchTerm, 'i');
    filter.$or = [{'title': re}, {'content': re}];

    // V4 (replaces `Note.find(filter)` below):
    // Note.find().or(searchArray)
  }

  if (folderId) {
    filter.folderId = folderId;
  }

  if (tagId) {
    filter.tags = tagId;
  }

  Note.find(filter)
    .populate('tags', 'name')
    .sort({ updatedAt: 'desc' })
    .then(results => {
      if (results) {
        res.json(results); // => Client
      } else {
        next(); // => 404 handler
      }
    })
    .catch(err => next(err)); // => Error handler
});

/* ========== GET/READ A SINGLE NOTE ========== */
router.get('/:id', (req, res, next) => {
  if (!ObjectId.isValid(req.params.id)) {
    const err = new Error('Invalid id');
    err.status = 400;
    return next(err); // => Error handler
  }

  Note.findById(req.params.id)
    .populate('tags', 'name')
    .then(result => {
      if (result) {
        res.json(result); // => Client
      } else {
        next(); // => 404 handler
      }
    })
    .catch(err => next(err)); // => Error handler
});

/* ========== POST/CREATE A NOTE ========== */
router.post('/', (req, res, next) => {
  const { title, content, folderId, tags } = req.body;

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err); // => Error handler
  }

  if (folderId && !ObjectId.isValid(folderId)) {
    const err = new Error('`folderId` is not a valid Mongo ObjectId');
    err.status = 400;
    return next(err); // => Error handler
  }

  if (tags) {
    tags.forEach(tag => {
      if (!ObjectId.isValid(tag)) {
        const err = new Error('`tagId` is not a valid Mongo ObjectId');
        err.status = 400;
        return next(err); // => Error handler
      }
    });
  }

  const newNote = {
    title,
    content,
    folderId: (folderId) ? folderId : null,
    tags: (tags) ? tags : []
  };

  Note.create(newNote)
    .then(result => {
      if (result) {
        res.location(`http://${req.originalUrl}/${result.id}`)
          .status(201)
          .json(result); // => Client
      } else {
        next(); // => 404 handler
      }
    })
    .catch(err => next(err)); // => Error handler
});

/* ========== PUT/UPDATE A SINGLE NOTE ========== */
router.put('/:id', (req, res, next) => {
  const noteId = req.params.id;
  const { title, content, folderId, tags } = req.body;

  /***** Never trust users - validate input *****/
  if (!ObjectId.isValid(noteId)) {
    const err = new Error('Invalid id');
    err.status = 400;
    return next(err); // => Error handler
  }

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err); // => Error handler
  }

  if (folderId && !ObjectId.isValid(folderId)) {
    const err = new Error('`folderId` is not a valid Mongo ObjectId');
    err.status = 400;
    return next(err); // => Error handler
  }

  if (tags) {
    tags.forEach(tag => {
      if (!ObjectId.isValid(tag)) {
        const err = new Error('`tagId` is not a valid Mongo ObjectId');
        err.status = 400;
        return next(err); // => Error handler
      }
    });
  }

  const updateObj = {
    title,
    content,
    folderId: (folderId) ? folderId : null,
    tags: (tags) ? tags : []
  };

  Note.findByIdAndUpdate(noteId, {$set: updateObj}, { new: true })
    .then(result => {
      if (result) {
        res.json(result); // => Client
      } else {
        next(); // => 404 handler
      }
    })
    .catch(err => next(err)); // => Error handler
});

/* ========== DELETE/REMOVE A SINGLE NOTE ========== */
router.delete('/:id', (req, res, next) => {
  if (!ObjectId.isValid(req.params.id)) {
    const err = new Error('Invalid id');
    err.status = 400;
    return next(err); // => Error handler
  }

  Note.findByIdAndRemove(req.params.id)
    .then(() => {
      // Respond with a 204 status
      res.sendStatus(204); // => Client
    })
    .catch(err => next(err)); // => Error handler
});

module.exports = router;
