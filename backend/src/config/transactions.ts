import mongoose, { type ClientSession } from 'mongoose'
import { logger } from './logger.js'

let transactionSupport: boolean | null = null

const detectTransactionSupport = async (): Promise<boolean> => {
  try {
    const admin = mongoose.connection.db?.admin()
    if (!admin) {
      return false
    }

    const info = (await admin.command({ hello: 1 })) as { setName?: string; msg?: string }
    return Boolean(info.setName) || info.msg === 'isdbgrid'
  } catch {
    return false
  }
}

export const supportsTransactions = async () => {
  if (transactionSupport === null) {
    transactionSupport = await detectTransactionSupport()

    if (!transactionSupport) {
      logger.warn(
        'MongoDB no expone replica set: las operaciones criticas se ejecutaran sin transaccion. ' +
          'En produccion (Atlas) y en los tests si hay transacciones.',
      )
    }
  }

  return transactionSupport
}

export async function withOptionalTransaction<T>(
  operation: (session?: ClientSession) => Promise<T>,
): Promise<T> {
  if (!(await supportsTransactions())) {
    return operation(undefined)
  }

  const session = await mongoose.startSession()

  try {
    let result: T | undefined
    await session.withTransaction(async () => {
      result = await operation(session)
    })
    return result as T
  } finally {
    await session.endSession()
  }
}

export const resetTransactionSupportCache = () => {
  transactionSupport = null
}
