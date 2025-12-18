// Load environment variables with priority: .env.local > .env
import * as dotenv from 'dotenv'
import path from 'node:path'

// Load .env first (default values)
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
// Load .env.local second (overrides with secure values)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
import process from 'node:process'
import asyncFs from 'node:fs/promises'
import * as http from 'node:http'
import * as https from 'node:https'
import { ServerOptions } from 'node:https'
import * as env from './config/env.config'
import * as databaseHelper from './common/databaseHelper'
import app from './app'
import * as logger from './common/logger'

const dbConnected = await databaseHelper.connect(env.DB_URI, env.DB_SSL, env.DB_DEBUG)
const dbInitialized = dbConnected ? await databaseHelper.initialize() : false

if (dbConnected && dbInitialized) {
  logger.info('Database connected and initialized successfully')

  // Initialize default data if needed - DISABLED FOR NOW
  // try {
  //   // Import and run the initialization function directly
  //   const { runFullInitialization } = await import('./scripts/init-default-data.js')
  //   const defaultDataInitialized = await runFullInitialization()

  //   if (defaultDataInitialized) {
  //     logger.info('Default data initialization completed successfully')
  //   } else {
  //     logger.warn('Default data initialization had issues, but continuing...')
  //   }
  // } catch (error) {
  //   logger.warn('Could not run default data initialization:', error)
  // }

  logger.info('Skipping default data initialization (disabled)')
} else {
  logger.info('Database connection failed - running in limited mode')
}

// Start server regardless of database connection status
{
  let server: https.Server | http.Server

  if (env.HTTPS) {
    https.globalAgent.maxSockets = Number.POSITIVE_INFINITY
    const privateKey = await asyncFs.readFile(env.PRIVATE_KEY, { encoding: 'utf8' })
    const certificate = await asyncFs.readFile(env.CERTIFICATE, { encoding: 'utf8' })
    const credentials: ServerOptions = { key: privateKey, cert: certificate }
    server = https.createServer(credentials, app)

    server.listen(env.PORT, '0.0.0.0', () => {
      logger.info('HTTPS server is running on Port', env.PORT)
    })
  } else {
    server = app.listen(env.PORT, '0.0.0.0', () => {
      logger.info('HTTP server is running on Port', env.PORT)
    })
  }

  const close = () => {
    logger.info('Gracefully stopping...')
    server.close(async () => {
      logger.info(`HTTP${env.HTTPS ? 'S' : ''} server closed`)
      await databaseHelper.close(true)
      logger.info('Database connection closed')
      process.exit(0)
    })
  }

  ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => process.on(signal, close))
}
