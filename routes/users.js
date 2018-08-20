'use strict';

const express = require('express');
const User = require('../models/user');

const router = express.Router();

router.post('/users', (req, res) => {
  let { username, password, fullname = '' } = req.body;

  fullname = fullname.trim();

  return User.find({ username })
    .count()
    .then(count => {
      if (count > 0) {
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Username already taken',
          location: 'username'
        });
      }
    })
    .then(() => {
      return User.create({
        username,
        password,
        fullname
      });
    })
    .then(user => {
      return res.status(201)
        .location(`/api/users/${user.id}`)
        .json(user);
    })
    .catch(err => {
      if (err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500)
        .json({
          code: 500,
          message: 'Internal server error'
        });
    });
});

module.exports = { router };
