'use strict';

var _ = require('lodash');
var app = require('./lib/express');
var clog = require('c.log');
var config = require('./lib/config');
var path = require('path');
var sequelize = require('./lib/sequelize');

//load models and sync database
_.forEach(config.files.server.models, function (model) {
  require(path.resolve('./' + model));
});

sequelize.sync()
  .then(function(){
    app.listen(config.port, function (){
      clog.green('Listening on port ' + config.port);
    });
  });
