'use strict';

const express = require('express');
const passport = require('passport');
const Tag = require('../models/tag');
const Note = require('../models/note');
const ObjectId = require('mongoose').Types.ObjectId;

// Create a router instance (aka "mini-app")
const router = express.Router();

router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

/* ========== GET/READ ALL TAGS ========== */
router.get('/', (req, res, next) => {
  Tag.find()
    .sort('name')
    .then(results => {
      if (results) {
        res.json(results); // => Client
      } else {
        next(); // => 404 handler
      }
    })
    .catch(err => next(err)); // => Error handler
});

/* ========== GET/READ A SINGLE TAG ========== */
router.get('/:id', (req, res, next) => {
  if (!ObjectId.isValid(req.params.id)) {
    const err = new Error('Invalid id');
    err.status = 400;
    return next(err); // => Error handler
  }
  
  Tag.findById(req.params.id)
    .then(result => {
      if (result) {
        res.json(result); // => Client
      } else {
        next(); // => 404 handler
      }
    })
    .catch(err => next(err)); // => Error handler
});

/* ========== POST/CREATE A TAG ========== */
router.post('/', (req, res, next) => {
  const { name } = req.body;

  /***** Never trust users - validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err); // => Error handler
  }

  const newTag = { name };

  Tag.create(newTag)
    .then(result => {
      if (result) {
        res.location(`http://${req.originalUrl}/${result.id}`)
          .status(201)
          .json(result); // => Client
      } else {
        next(); // => 404 handler
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The tag name already exists');
        err.status = 400;
      }
      next(err); // => Error handler
    });
});

/* ========== PUT/UPDATE A SINGLE TAG ========== */
router.put('/:id', (req, res, next) => {
  const tagId = req.params.id;
  const { name } = req.body;

  /***** Never trust users - validate input *****/
  if (!ObjectId.isValid(tagId)) {
    const err = new Error('Invalid id');
    err.status = 400;
    return next(err); // => Error handler
  }

  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err); // => Error handler
  }

  const updateObj = { name };

  Tag.findByIdAndUpdate(tagId, {$set: updateObj}, { new: true })
    .then(result => {
      if (result) {
        res.json(result); // => Client
      } else {
        next(); // => 404 handler
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The tag name already exists');
        err.status = 400;
      }
      next(err); // => Error handler
    });
});

/* ========== DELETE/REMOVE A SINGLE TAG ========== */
router.delete('/:id', (req, res, next) => {
  const tagId = req.params.id;

  if (!ObjectId.isValid(tagId)) {
    const err = new Error('Invalid id');
    err.status = 400;
    return next(err); // => Error handler
  }
  
  Note.updateMany({'tags': tagId}, {$pull: {'tags': tagId}})
    .then(() => {
      return Tag.findByIdAndRemove(tagId);
    })
    .then(() => {
      // Respond with a 204 status
      res.sendStatus(204); // => Client
    })
    .catch(err => next(err)); // => Error handler
});

module.exports = router;
