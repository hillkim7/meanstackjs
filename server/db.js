module.exports.mongoDB = mongoDB
module.exports.disconnect = disconnect

var mongoose = require('mongoose')
var debug = require('debug')('meanstackjs:db')
var glob = require('glob')
var _ = require('lodash')
var path = require('path')
var disconnectedBy = false

function mongoDB (self) {
  // Connect to MongoDb
  mongoose.Promise = global.Promise
  mongoose.set('debug', self.settings.mongodb.debug)
  mongoose.connection.on('error', function (error) {
    self.logger.warn('MongoDB Connection Error. Please make sure that MongoDB is running.')
    debug('MongoDB Connection Error ', error)
  })
  mongoose.connection.on('open', function () {
    debug('MongoDB Connection Open ')
  })
  mongoose.connection.on('reconnected', function () {
    debug('MongoDB reconnected!')
  })
  mongoose.connection.on('disconnected', function () {
    if (!disconnectedBy) {
      debug('MongoDB disconnected! -- connect again')
      setTimeout(function (){ mongoose.connect(self.settings.mongodb.uri, self.settings.mongodb.options) }, 5000)
    }
  })
  mongoose.connect(self.settings.mongodb.uri, self.settings.mongodb.options)
  // Register All Mongoose Models
  self.models = {}
  var files = glob.sync('server/modules/**/*.model.js')
  files.forEach(function (model, key) {
    var name = _.words(path.basename(model), /[^. ]+/g)[0]
    debug('Model: %s - %s', name, model)
    self.models[name] = mongoose.model(name, require('../' + model))
    self.models[name].on('index', function (error) {
      if (error) throw error
    })
  })
}
function disconnect (cb) {
  if (!cb)cb = function () {}
  disconnectedBy = True
  mongoose.disconnect(cb)
}
