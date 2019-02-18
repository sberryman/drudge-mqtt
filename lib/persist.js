'use strict'

const sqlite3 = require('sqlite3').verbose()
const Joi = require('joi')
const schema = Joi.object({
  DB_PATH: Joi.string()
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
  throw new Error(`Persist config validation error: ${error.message}`)
}

module.exports = (options) => {
  // alias
  const { log, eventEmitter } = options
  log.info(`[Persist] Path: ${config.DB_PATH}`)

  // create the db connection
  const db = new sqlite3.Database(config.DB_PATH)

  const dbInit = () => {
    db.run(`CREATE TABLE IF NOT EXISTS links(
      url varchar(2000) UNIQUE,
      ts_first bigint,
      ts_last bigint,
      important boolean,
      headline boolean,
      ignore boolean,
      summary varchar(2000)
      )`)
  }
  const trigger = (link) => {
    log.debug(`[Persist] Link...`, link)

    // get the row
    db.get(
      'SELECT * FROM links WHERE url=?',
      [link.url],
      (err, row) => {
        if (err) {
          return log.error(err)
        }

        const isNew = (typeof row === 'undefined')

        if (isNew) {
          log.debug(`[Persist] New link`)

          return db.run(
            `INSERT INTO links
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              link.url,
              link.at,
              link.at,
              link.important === true,
              link.headline === true,
              false,
              link.text
            ],
            function (err) {
              if (err) {
                return log.error(err)
              }

              // SUCCESS!
              eventEmitter.emit('NEW', link)
            }
          )
        }

        log.debug(`[Persist] Update link`)
        if (link.at > row.ts_last) {
          return db.run(
            `UPDATE links
              SET ts_last = ?
              WHERE url = ?`,
            [
              link.at,
              row.url
            ],
            (err) => {
              if (err) {
                log.error(err)
              }
            }
          )
        }
      }
    )
  }

  // subscribe to LINK events
  eventEmitter.on('LINK', trigger)

  // ensure the db gets closed on restart!
  // const closeDB = () => {
  //   db.close()
  //   process.exit()
  // }
  // process.on('exit', closeDB)
  // process.on('SIGHUP', closeDB);
  // process.on('SIGINT', closeDB);
  // process.on('SIGTERM', closeDB);

  // init the db!
  dbInit()
}
