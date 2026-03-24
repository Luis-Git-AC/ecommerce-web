import bcrypt from 'bcryptjs'
import { connectToDatabase, disconnectDatabase } from '../src/config/db'
import { logger } from '../src/config/logger'
import { UserModel } from '../src/modules/auth/schemas/user.schema'

const SALT_ROUNDS = 12

const adminName = (process.env.ADMIN_NAME as string | undefined)?.trim() || 'Admin Ecommerce'
const adminEmail = ((process.env.ADMIN_EMAIL as string | undefined)?.trim().toLowerCase()) || 'admin@ecommerce.local'
const adminPassword = (process.env.ADMIN_PASSWORD as string | undefined)?.trim() || 'Admin12345!'

async function runSeedAdmin() {
  if (adminPassword.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters')
  }

  await connectToDatabase()

  try {
    const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS)

    const admin = await UserModel.findOneAndUpdate(
      { email: adminEmail },
      {
        name: adminName,
        email: adminEmail,
        role: 'admin',
        passwordHash,
      },
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
      },
    )

    logger.info(
      {
        id: String(admin._id),
        email: admin.email,
        role: admin.role,
      },
      'Admin seed completed',
    )
  } finally {
    await disconnectDatabase()
  }
}

runSeedAdmin().catch((error) => {
  logger.error(error, 'Admin seed failed')
  process.exit(1)
})
