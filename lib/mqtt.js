'use strict'

const Mqtt = require('mqtt')
const Joi = require('joi')
const schema = Joi.object({
  MQTT_URL: Joi.string()
    .uri({
      scheme: ['mqtt', 'mqtts', 'ws', 'wss']
    }),

  MQTT_TOPIC: Joi.string(),

  MQTT_USERNAME: Joi.string()
    .optional(),

  MQTT_PASSWORD: Joi.string()
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
  throw new Error(`MQTT config validation error: ${error.message}`)
}

module.exports = (options) => {
  // alias
  const { log, eventEmitter } = options

  // connect to mqtt
  const client = Mqtt.connect(
    config.MQTT_URL,
    {
      username: config.MQTT_USERNAME,
      password: config.MQTT_PASSWORD
    }
  )

  log.info(`[MQTT] Connecting to ${config.MQTT_URL}`)

  const trigger = (link) => {
    log.info('[MQTT] New link!', link)

    // publish to mqtt
    client.publish(config.MQTT_TOPIC, JSON.stringify(link))
  }

  // subscribe to our events
  eventEmitter.on('NEW', trigger)
}
