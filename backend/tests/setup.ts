import { inject } from 'vitest'

/**
 * Inyecta la URI de la instancia efimera en process.env ANTES de que cualquier
 * test importe src/config/env.ts, que lee process.env una sola vez al cargarse.
 *
 * globalSetup ya escribe process.env.MONGODB_URI, pero segun el pool de Vitest
 * los workers no siempre heredan ese valor. inject() si es fiable en ambos casos.
 */
process.env.MONGODB_URI = inject('mongoUri')
process.env.MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? 'ecommerce-web'

/**
 * Credenciales ficticias de Stripe.
 *
 * PaymentService decide en su constructor si instancia el cliente segun
 * env.STRIPE_SECRET_KEY; sin valor devuelve 500 y los tests fallan aunque el
 * SDK este mockeado. Estos valores solo permiten construir el cliente: los
 * tests sustituyen el modulo 'stripe' entero con vi.mock, asi que no se emite
 * ninguna peticion de red ni se usa ninguna clave real.
 */
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? 'sk_test_dummy_never_used'
process.env.STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_dummy_never_used_in_tests'

/**
 * Cloudinary se vacia explicitamente, sin importar lo que tenga backend/.env.
 *
 * env.ts carga el .env real del desarrollador (dotenv/config). Si tiene
 * credenciales validas, el test que verifica el 503 "Cloudinary no
 * configurado" deja de ser valido: el SDK intenta una subida real y falla
 * con otro codigo. isCloudinaryConfigured debe evaluar false en todo entorno
 * de test, tenga o no el desarrollador credenciales reales en local.
 *
 * Se asigna '' en vez de "delete": dotenv solo respeta las claves que YA
 * existen en process.env, y "delete" las deja ausentes, asi que dotenv las
 * habria rellenado de nuevo desde el .env real al importarse env.ts.
 */
process.env.CLOUDINARY_CLOUD_NAME = ''
process.env.CLOUDINARY_API_KEY = ''
process.env.CLOUDINARY_API_SECRET = ''
