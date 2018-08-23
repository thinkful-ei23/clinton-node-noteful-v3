'use strict';

const express = require('express');
const ObjectId = require('mongoose').Types.ObjectId;

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');

// Create a router instance (aka "mini-app")
const router = express.Router();

/* ========== GET/READ ALL NOTES + SEARCH BY QUERY ========== */
router.get('/', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;
  const filter = { userId: req.user.id };

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
  const { id } = req.params;
  const userId = req.user.id;
  
  if (!ObjectId.isValid(req.params.id)) {
    const err = new Error('Invalid id');
    err.status = 400;
    return next(err); // => Error handler
  }

  Note.findOne({ _id: id, userId })
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
  const userId = req.user.id;
  const { title, content, folderId, tags } = req.body;

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err); // => Error handler
  }

  const newNote = {
    title,
    content,
    userId,
    folderId,
    tags: []
  };

  if (newNote.folderId === '') {
    delete newNote.folderId;
  }

  Folder.findOne({_id: newNote.folderId, userId})
    .then(result => {
      if (newNote.folderId && (!result || !ObjectId.isValid(folderId))) {
        const err = new Error('`folderId` is not valid');
        err.status = 400;
        return Promise.reject(err); // => Error handler
      }
      if (result) {
        newNote.folderId = result.id;
      }
      return Tag.find({userId, _id: {$in: tags}});
    })
    .then(result => {
      if (result) {
        result.forEach(tag => {
          if (!ObjectId.isValid(tag.id)) {
            const err = new Error('`tagId` is not valid');
            err.status = 400;
            return Promise.reject(err); // => Error handler
          }
        });
      }
      if (tags && result.length !== tags.length) {
        const err = new Error('`tagId` is not valid');
        err.status = 400;
        return Promise.reject(err); // => Error handler
      }
      if (result) {
        result.forEach(tag => {
          newNote.tags.push(tag.id);
        });
      }
      return Note.create(newNote);
    })
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
  const { id } = req.params;
  const userId = req.user.id;
  const { title, content, folderId, tags } = req.body;

  /***** Never trust users - validate input *****/
  if (!ObjectId.isValid(id)) {
    const err = new Error('Invalid id');
    err.status = 400;
    return next(err); // => Error handler
  }

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err); // => Error handler
  }

  if (!Array.isArray(tags)) {
    const err = new Error('`tags` must be an array');
    err.status = 400;
    return next(err); // => Error handler
  }

  const updateObj = {
    title,
    content,
    folderId,
    tags: []
  };

  if (updateObj.folderId === '') {
    delete updateObj.folderId;
  }

  Folder.findOne({_id: updateObj.folderId, userId})
    .then(result => {
      if (updateObj.folderId && (!result || !ObjectId.isValid(folderId))) {
        const err = new Error('`folderId` is not valid');
        err.status = 400;
        return Promise.reject(err); // => Error handler
      }
      if (result) {
        updateObj.folderId = result.id;
      }
      return Tag.find({userId, _id: {$in: tags}});
    })
    .then(result => {
      if (result) {
        result.forEach(tag => {
          if (!ObjectId.isValid(tag.id)) {
            const err = new Error('`tagId` is not valid');
            err.status = 400;
            return Promise.reject(err); // => Error handler
          }
        });
      }
      if (tags && result.length !== tags.length) {
        const err = new Error('`tagId` is not valid');
        err.status = 400;
        return Promise.reject(err); // => Error handler
      }
      if (result) {
        result.forEach(tag => {
          updateObj.tags.push(tag.id);
        });
      }
      return Note.findOneAndUpdate({ _id: id, userId }, {$set: updateObj}, { new: true });
    })
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
  const { id } = req.params;
  const userId = req.user.id;
  
  if (!ObjectId.isValid(id)) {
    const err = new Error('Invalid id');
    err.status = 400;
    return next(err); // => Error handler
  }

  Note.deleteOne({ _id: id, userId })
    .then(() => {
      // Respond with a 204 status
      res.sendStatus(204); // => Client
    })
    .catch(err => next(err)); // => Error handler
});

module.exports = router;
