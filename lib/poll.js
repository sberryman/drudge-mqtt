'use strict'

const Joi = require('joi')
const schema = Joi.object({
  POLL_ON_INIT: Joi.boolean()
    .default(true)
    .optional(),

  POLL_FREQUENCY: Joi.number()
    .min(60)
    .positive()
    .unit('seconds')
    .default(120)
    .optional()
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
  throw new Error(`Polling config validation error: ${error.message}`)
}

module.exports = (options) => {
  // alias
  const { log, eventEmitter } = options

  const pollFrequency = config.POLL_FREQUENCY * 1000
  log.info(`[Poll] Init with an interval of ${pollFrequency}ms`)

  const trigger = () => {
    log.debug('[Poll] Emit')
    eventEmitter.emit('POLL')
  }

  // setup our interval
  setInterval(trigger, pollFrequency)

  // fire an event if requested
  if (config.POLL_ON_INIT === true) {
    process.nextTick(trigger)
  }
}
