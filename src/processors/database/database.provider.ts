/**
 * @file Database providers > mongoose connection
 * @module processor/database/providers
 */

import mongoose from 'mongoose'
import { EmailService } from '@app/processors/helper/helper.service.email'
import { DB_CONNECTION_TOKEN } from '@app/constants/system.constant'
import * as APP_CONFIG from '@app/app.config'
import logger from '@app/utils/logger'

const log = logger.scope('MongoDB')

export const databaseProvider = {
  inject: [EmailService],
  provide: DB_CONNECTION_TOKEN,
  useFactory: async (emailService: EmailService) => {
    let reconnectionTask: NodeJS.Timeout | null = null
    const RECONNECT_INTERVAL = 6000

    const sendAlarmMail = (error: string) => {
      emailService.sendMailAs(APP_CONFIG.APP.NAME, {
        to: APP_CONFIG.APP.ADMIN_EMAIL,
        subject: `MongoDB Error!`,
        text: error,
        html: `<pre><code>${error}</code></pre>`,
      })
    }

    const connection = () => {
      return mongoose.connect(APP_CONFIG.MONGO_DB.uri, {})
    }

    mongoose.connection.on('connecting', () => {
      log.info('connecting...')
    })

    mongoose.connection.on('open', () => {
      log.info('readied (open).')
      if (reconnectionTask) {
        clearTimeout(reconnectionTask)
        reconnectionTask = null
      }
    })

    mongoose.connection.on('disconnected', () => {
      log.error(`disconnected! retry when after ${RECONNECT_INTERVAL / 1000}s`)
      reconnectionTask = setTimeout(connection, RECONNECT_INTERVAL)
    })

    mongoose.connection.on('error', (error) => {
      log.error('error!', error)
      mongoose.disconnect()
      sendAlarmMail(String(error))
    })

    return await connection()
  },
}
