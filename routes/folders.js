'use strict';

const express = require('express');
const ObjectId = require('mongoose').Types.ObjectId;

const Folder = require('../models/folder');
const Note = require('../models/note');

// Create a router instance (aka "mini-app")
const router = express.Router();

/* ========== GET/READ ALL FOLDERS ========== */
router.get('/', (req, res, next) => {
  Folder.find({userId: req.user.id})
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

/* ========== GET/READ A SINGLE FOLDER ========== */
router.get('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!ObjectId.isValid(id)) {
    const err = new Error('Invalid id');
    err.status = 400;
    return next(err); // => Error handler
  }
  
  Folder.findOne({ _id: id, userId })
    .then(result => {
      if (result) {
        res.json(result); // => Client
      } else {
        next(); // => 404 handler
      }
    })
    .catch(err => next(err)); // => Error handler
});

/* ========== POST/CREATE A FOLDER ========== */
router.post('/', (req, res, next) => {
  const { name } = req.body;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err); // => Error handler
  }

  const newFolder = { name, userId };

  Folder.create(newFolder)
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
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err); // => Error handler
    });
});

/* ========== PUT/UPDATE A SINGLE FOLDER ========== */
router.put('/:id', (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!ObjectId.isValid(id)) {
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

  Folder.findOneAndUpdate({ _id: id, userId }, {$set: updateObj}, { new: true })
    .then(result => {
      if (result) {
        res.json(result); // => Client
      } else {
        next(); // => 404 handler
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err); // => Error handler
    });
});

/* ========== DELETE/REMOVE A SINGLE NOTE ========== */
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!ObjectId.isValid(id)) {
    const err = new Error('Invalid id');
    err.status = 400;
    return next(err); // => Error handler
  }
  
  Note.updateMany({'folderId': id, userId}, {$unset: {'folderId': 1}})
    .then(() => {
      return Folder.deleteOne({ _id: id, userId });
    })
    .then(() => {
      // Respond with a 204 status
      res.sendStatus(204); // => Client
    })
    .catch(err => next(err)); // => Error handler
});

module.exports = router;
