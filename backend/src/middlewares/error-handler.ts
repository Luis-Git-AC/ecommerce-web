import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../common/errors/http-error'
import { logger } from '../config/logger'

export function notFoundHandler(req: Request, res: Response) {
  const requestId = (req as Request & { id?: string }).id

  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    requestId,
  })
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  void _next
  const requestId = (req as Request & { id?: string }).id

  logger.error(
    {
      error,
      requestId,
      method: req.method,
      path: req.originalUrl,
      userId: req.auth?.userId,
    },
    'Request failed',
  )

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      message: error.message,
      requestId,
    })
    return
  }

  res.status(500).json({
    message: 'Internal server error',
    requestId,
  })
}
