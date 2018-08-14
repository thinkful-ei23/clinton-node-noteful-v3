'use strict';

module.exports = {
  // Sets value of `PORT` to either `process.env.PORT`
  // (when hosting app on production server) or `8080`
  // (when testing app in local dev environment)
  PORT: process.env.PORT || 8080,
  // `MONGODB_URI` is used by Heroku's mLab Add-On
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost/noteful'
};