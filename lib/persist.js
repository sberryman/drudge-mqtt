'use strict'

const mysql = require('mysql')
const Joi = require('joi')

// validate it!
const schema = Joi.object({
  MYSQL_HOST: Joi.string(),

  MYSQL_PORT: Joi.number()
    .positive()
    .optional()
    .default(3306),

  MYSQL_USER: Joi.string()
    .optional(),

  MYSQL_PASSWORD: Joi.string()
    .optional(),

  MYSQL_DATABASE: Joi.string()
    .default('drudge')
})
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
  const db = mysql.createConnection({
    host: config.MYSQL_HOST,
    port: config.MYSQL_PORT,
    user: config.MYSQL_USER,
    password: config.MYSQL_PASSWORD,
    database: config.MYSQL_DATABASE
  })

  // connect!
  db.connect()

  const dbInit = () => {
    db.query(`CREATE TABLE IF NOT EXISTS links(
      id INT NOT NULL AUTO_INCREMENT,
      url VARCHAR(2000) UNIQUE,
      ts_first BIGINT,
      ts_last BIGINT,
      important BIT,
      headline BIT,
      advert BIT,
      summary VARCHAR(2000),
      PRIMARY KEY (id)
    );`,
    (err, results) => {
      if (err) {
        log.error(err)

        // kill the process, this is really bad!
        process.exit(1)
      }
    })
  }
  const trigger = (link) => {
    log.debug(`[Persist] Link...`, link)

    // get the row
    db.query(
      'SELECT * FROM `links` WHERE `url`=? LIMIT 1',
      [link.url],
      (err, row) => {
        if (err) {
          return log.error(err)
        }

        const isNew = (typeof row === 'undefined' || row.length < 1)

        if (isNew) {
          log.debug(`[Persist] New link`)

          return db.query(
            'INSERT INTO `links` (url, ts_first, ts_last, important, headline, advert, summary) VALUES (?, ?, ?, ?, ?, ?, ?)',
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
        if (link.at > row[0].ts_last) {
          return db.query(
            'UPDATE `links` SET `ts_last` = ? WHERE `id` = ?',
            [
              link.at,
              row[0].id
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
  process.on('exit', () => {
    db.end()
  })
  // process.on('SIGHUP', closeDB);
  // process.on('SIGINT', closeDB);
  // process.on('SIGTERM', closeDB);

  // init the db!
  dbInit()
}
