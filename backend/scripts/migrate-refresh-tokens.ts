import { connectToDatabase, disconnectDatabase } from '../src/config/db'
import { logger } from '../src/config/logger'
import { UserModel } from '../src/modules/auth/schemas/user.schema'

/**
 * Migra el modelo de sesiones antiguo al nuevo.
 *
 * Antes cada usuario tenia un unico `refreshTokenHash`. Ahora se guarda un
 * array `refreshTokens` con varias sesiones y un contador `tokenVersion`.
 *
 * La migracion es idempotente y tolerante a documentos que ya esten migrados o
 * que nunca hayan tenido sesion iniciada.
 *
 * Uso:  npx tsx scripts/migrate-refresh-tokens.ts
 */
async function run() {
  await connectToDatabase()

  try {
    const collection = UserModel.collection

    // 1) tokenVersion en los usuarios que no lo tengan.
    const versionResult = await collection.updateMany(
      { tokenVersion: { $exists: false } },
      { $set: { tokenVersion: 0 } },
    )

    // 2) refreshTokens vacio donde no exista el campo.
    const arrayResult = await collection.updateMany(
      { refreshTokens: { $exists: false } },
      { $set: { refreshTokens: [] } },
    )

    // 3) Convierte el hash antiguo en la primera entrada del array.
    //    Se le da una caducidad de 7 dias, coherente con JWT_REFRESH_EXPIRES_IN.
    const legacyUsers = await collection
      .find({ refreshTokenHash: { $exists: true, $ne: null } })
      .toArray()

    let converted = 0
    for (const user of legacyUsers) {
      const tokenHash = user.refreshTokenHash

      if (typeof tokenHash === 'string' && tokenHash.length > 0) {
        await collection.updateOne(
          { _id: user._id },
          {
            $set: {
              refreshTokens: [
                {
                  tokenHash,
                  createdAt: new Date(),
                  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
              ],
            },
          },
        )
        converted += 1
      }
    }

    // 4) Retira el campo antiguo.
    const cleanupResult = await collection.updateMany(
      { refreshTokenHash: { $exists: true } },
      { $unset: { refreshTokenHash: '' } },
    )

    logger.info(
      {
        tokenVersionAdded: versionResult.modifiedCount,
        refreshTokensInitialized: arrayResult.modifiedCount,
        sessionsConverted: converted,
        legacyFieldRemoved: cleanupResult.modifiedCount,
      },
      'Migracion de sesiones completada',
    )
  } finally {
    await disconnectDatabase()
  }
}

run().catch((error) => {
  logger.error(error, 'La migracion de sesiones ha fallado')
  process.exit(1)
})
