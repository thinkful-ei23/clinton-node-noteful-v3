'use strict';

// Load Express, Morgan, Mongoose, Config, and Routers into the file
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const passport = require('passport');

const { PORT, MONGODB_URI } = require('./config');
const localStrategy = require('./passport/local');
const jwtStrategy = require('./passport/jwt');

const notesRouter = require('./routes/notes');
const foldersRouter = require('./routes/folders');
const tagsRouter = require('./routes/tags');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');

// Create an Express application
const app = express();

// Log all requests. Skip logging during testing.
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'common', {
  skip: () => process.env.NODE_ENV === 'test'
}));

// Create a static webserver
app.use(express.static('public'));

// Parse incoming requests that contain JSON and
// make them available on `req.body`
app.use(express.json());

// Set the strategies to use
passport.use(localStrategy);
passport.use(jwtStrategy);

// Route all requests through the proper Routers
app.use('/api', authRouter);
app.use('/api/users', usersRouter);

const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true });
app.use('/api', jwtAuth);

app.use('/api/notes', notesRouter);
app.use('/api/folders', foldersRouter);
app.use('/api/tags', tagsRouter);

// Custom 404 Not Found route handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Custom 'Catch-All' Error Handler
app.use((err, req, res, next) => {
  if (err.status) {
    const errBody = Object.assign({}, err, { message: err.message });
    res.status(err.status).json(errBody);
  } else {
    console.error(err.name === 'FakeError' ? '' : err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Could instead do the module method...
if (process.env.NODE_ENV !== 'test') {
  
  // Connect to the Mongo database
  mongoose.connect(MONGODB_URI)
    .then(instance => {
      const conn = instance.connections[0];
      console.info(`Connected to: mongodb://${conn.host}:${conn.port}/${conn.name}`);
    })
    .catch(err => {
      console.error(`ERROR: ${err.message}`);
      console.error('\n === Did you remember to start `mongod`? === \n');
      console.error(err);
    });

  // Listen for incoming connections
  app.listen(PORT, function () {
    console.info(`Server listening on ${this.address().port}`);
  }).on('error', err => {
    console.error(err);
  });

}

module.exports = app; // Export for testing
