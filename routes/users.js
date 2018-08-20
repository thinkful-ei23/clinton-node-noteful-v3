'use strict';

const express = require('express');
const User = require('../models/user');

const router = express.Router();

router.post('/', (req, res, next) => {
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
      return User.hashPassword(password);
    })
    .then(digest => {
      const newUser = {
        username,
        password: digest,
        fullname
      };
      return User.create(newUser);
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
      if (err.code === 11000) {
        err = new Error('The username already exists');
        err.status = 400;
      }
      next(err);
    });
});

module.exports = router;
