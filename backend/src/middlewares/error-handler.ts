import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../common/errors/http-error'
import { logger } from '../config/logger'

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  void _next
  logger.error(error)

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      message: error.message,
    })
    return
  }

  res.status(500).json({
    message: 'Internal server error',
  })
}
