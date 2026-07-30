import { MongoMemoryReplSet } from 'mongodb-memory-server'

/**
 * Firma minima del contexto que Vitest pasa a globalSetup. Se declara aqui en
 * lugar de importar GlobalSetupContext desde 'vitest/node': ese tipo no se
 * exporta en Vitest 4 y su import type choca con el modulo CommonJS del backend.
 */
type GlobalSetupContext = {
  provide: (key: 'mongoUri', value: string) => void
}

/**
 * Arranca una instancia efimera de MongoDB para la suite de tests.
 *
 * Se usa MongoMemoryReplSet (no MongoMemoryServer) porque las transacciones
 * de Mongoose exigen un replica set. Con un unico nodo es suficiente y evita
 * depender de un cluster real, de credenciales o de conexion a internet una
 * vez descargado el binario.
 */
let replSet: MongoMemoryReplSet | null = null

export default async function setup({ provide }: GlobalSetupContext) {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
  })

  const uri = replSet.getUri()

  // Disponible para los workers via inject() y, de forma redundante, por env.
  provide('mongoUri', uri)
  process.env.MONGODB_URI = uri
  process.env.MONGODB_DB_NAME = 'ecommerce-web'

  return async () => {
    await replSet?.stop()
    replSet = null
  }
}

declare module 'vitest' {
  export interface ProvidedContext {
    mongoUri: string
  }
}
