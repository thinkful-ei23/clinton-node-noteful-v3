'use strict';

const express = require('express');
const Note = require('../models/note');

// Create a router instance (aka "mini-app")
const router = express.Router();

/* ========== GET/READ ALL NOTES + SEARCH BY QUERY ========== */
router.get('/', (req, res, next) => {
  const searchTerm = req.query.searchTerm;
  let filter = {};

  if (searchTerm) {
    const searchArray = [];
    searchArray.push({'title': {$regex: searchTerm, $options: 'i' }});
    searchArray.push({'content': {$regex: searchTerm, $options: 'i' }});
    filter = {$or: searchArray};
    // V2:
    // const re = new RegExp(searchTerm, 'i');
    // filter = {$or: [{'title': re}, {'content': re}]}

    // V3:
    // const re = new RegExp(searchTerm, 'i');
    // filter.$or = [{'title': re}, {'content': re}];

    // V4 (replaces `Note.find(filter)` below):
    // Note.find().or(searchArray)
  }

  Note
    .find(filter)
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
  Note
    .findById(req.params.id)
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
  const { title, content } = req.body;

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err); // => Error handler
  }

  const newNote = {
    title: title,
    content: content
  };

  Note
    .create(newNote)
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
  const { title, content } = req.body;

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err); // => Error handler
  }

  const updateObj = {
    title: title,
    content: content
  };

  Note
    .findByIdAndUpdate(noteId, {$set: updateObj}, { new: true })
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
  Note
    .findByIdAndRemove(req.params.id)
    .then(() => {
      // Respond with a 204 status
      res.sendStatus(204); // => Client
    })
    .catch(err => next(err)); // => Error handler
});

module.exports = router;
