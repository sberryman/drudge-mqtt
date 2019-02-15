'use strict'

// dependencies
const Winston = require('winston')
const RequireAll = require('require-all')
const EventEmitter = require('events').EventEmitter

// logger
const log = Winston.createLogger({
  level: process.env.LOG_LEVEL,
  transports: [new Winston.transports.Console({
    format: Winston.format.combine(
      Winston.format.colorize(),
      Winston.format.simple()
    )
  })],
})

// create our options that we pass to all plugins
const options = {
  log,
  eventEmitter: new EventEmitter()
}

// load all the files in lib (our plugins)
const plugins = RequireAll({
  dirname     :  __dirname + '/lib',
  recursive   : false
})

// load each "plugin" and pass in our eventemitter and config
Object.keys(plugins).forEach((pluginKey) => {
  plugins[pluginKey](options)
})
