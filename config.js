'use strict';

require('dotenv').config();

module.exports = {
  // Sets value of `PORT` to either `process.env.PORT`
  // (when hosting app on production server) or `8080`
  // (when testing app in local dev environment)
  PORT: process.env.PORT || 8080,
  // `MONGODB_URI` is used by Heroku's mLab Add-On
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost/noteful',
  TEST_MONGODB_URI: process.env.TEST_MONGODB_URI || 'mongodb://localhost/noteful-test',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '7d'
};
