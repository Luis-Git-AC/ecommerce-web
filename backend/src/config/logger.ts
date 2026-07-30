import pino from 'pino'
import { env } from './env'

const shouldUsePrettyLogs =
  env.NODE_ENV === 'development' && !process.env.VERCEL && Boolean(process.stdout.isTTY)

const transport = shouldUsePrettyLogs
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
      },
    }
  : undefined

const getLogLevel = () => {
  const configuredLevel = process.env.LOG_LEVEL || undefined

  if (env.NODE_ENV === 'test') {
    return configuredLevel ?? 'silent'
  }

  return configuredLevel ?? (env.NODE_ENV === 'production' ? 'info' : 'debug')
}

export const logger = pino({
  level: getLogLevel(),
  redact: {
    paths: [
      'req.headers.authorization',
      'request.headers.authorization',
      'headers.authorization',
      'password',
      'passwordHash',
      'refreshToken',
      'refreshTokenHash',
    ],
    censor: '[REDACTED]',
  },
  transport,
})
