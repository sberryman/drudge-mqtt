'use strict'

const Cheerio = require('cheerio')
const URL = require('url').URL
const Joi = require('joi')
const schema = Joi.object({
  at: Joi.number()
    .positive()
    .unit('milliseconds since epoch'),

  body: Joi.string()
})

// allowed protocols
const AllowedProtocols = ['http:', 'https:']

module.exports = (options) => {
  // alias
  const { log, eventEmitter } = options

  const trigger = (data) => {
    // validate it!
    log.debug(`[Parse] Processing payload`)
    const { error } = Joi.validate(
      data,
      schema,
      {
        presence: 'required',
        stripUnknown: true
      }
    )
    if (error) {
      throw new Error(`Parse validation error: ${error.message}`)
    }

    // how long did it take?
    const startTS = Date.now()

    // success!
    const $ = Cheerio.load(data.body)

    // find all the links
    const links = $('a')
    log.debug(`[Parse] Found ${links.length} links...`)

    // annoying we need to store here
    const parsedLinks = []

    // look through all the links and emit events?
    for (var i = 0; i < links.length; i++) {
    // for (var i = 0; i < 10; i++) {
      const link = $(links[i])

      // extract a few properties out
      const parsedLink = {
        at: data.at,
        text: link.text(),
        url: link.attr('href'),
        important: false,
        headline: false
      }

      // parse the url
      const parsedUrl = new URL(parsedLink.url, data.baseUrl)
      if (AllowedProtocols.indexOf(parsedUrl.protocol) === -1) {
        continue
      }

      // attach our domain
      // parsedLink.hostname = parsedUrl.hostname

      // check to see if this is the headline
      const linkParent = link.parent()
      if (linkParent.is('font')) {
        const fontSize = parseInt(linkParent.attr('size'), 10)

        if (!isNaN(fontSize) && fontSize >= 5) {
          parsedLink.headline = true
        }
      }

      // is it important? (red color)
      const firstChildFont = link.children('font')
      if (firstChildFont && firstChildFont.length > 0) {
        if (firstChildFont.attr('color') === 'red') {
          parsedLink.important = true
        }
      }

      // log it while debugging?
      // if (parsedLink.headline) {
      //   log.debug(JSON.stringify(parsedLink))
      // }
      // log.debug(JSON.stringify(parsedLink))

      // add to the array
      parsedLinks.push(parsedLink)
    }

    log.debug(`[Parse] Complete, duration ${Date.now() - startTS} ms`)

    // next tick!
    process.nextTick(() => {
      for (var i = 0; i < parsedLinks.length; i++) {
        // emit it!
        eventEmitter.emit('LINK', parsedLinks[i])
      }
    })
  }

  // subscribe to POLL events
  eventEmitter.on('PARSE', trigger)
}
