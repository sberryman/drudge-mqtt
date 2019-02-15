'use strict'

const Request = require('request')
const Joi = require('joi')
const schema = Joi.object({
  REQ_URL: Joi.string()
    .uri({
      scheme: ['http', 'https', 'file']
    })
})

// validate it!
const { error, value: config } = Joi.validate(
  process.env,
  schema,
  {
    presence: 'required',
    stripUnknown: true
  }
)
if (error) {
  throw new Error(`Config validation error: ${error.message}`)
}

module.exports = (options) => {
  // alias
  const { log, eventEmitter } = options
  log.info(`[Request] Source Url: ${config.REQ_URL}`)

  const trigger = () => {
    log.info(`[Request] Fetching updated data...`)

    // when did we start fetching? (also used as the "at" timestamp)
    const startTS = Date.now()

    Request(config.REQ_URL, function (err, response, body) {
      // fail quick!
      if (err) {
        return log.error(err)
      }

      // basic sanity
      if (response && response.statusCode !== 200) {
        return log.warning(`[Request] Unable to fetch, status code: ${response.statusCode}`)
      }

      // basic body length
      if (!body || body.length < 500) {
        return log.warning(`[Request] Body empty or abnormally small. ${body.length} chars`)
      }

      log.debug(`[Request] Success, duration ${Date.now() - startTS} ms`)
      process.nextTick(() => {
        eventEmitter.emit(
          'PARSE',
          {
            at: startTS,
            body,
            baseUrl: config.REQ_URL
          }
        )
      })
    })
  }

  // subscribe to POLL events
  eventEmitter.on('POLL', trigger)
}
