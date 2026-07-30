import { env } from '../config/env'
import { errorResponses, schemas, securitySchemes } from './components'

const wrapped = (ref: string) => ({
  type: 'object' as const,
  properties: { data: { $ref: ref } },
})

const json = (schema: unknown) => ({ 'application/json': { schema } })

const ok = (description: string, schema: unknown) => ({
  description,
  content: json(schema),
})

const query = (
  name: string,
  schema: Record<string, unknown>,
  description: string,
  extra: Record<string, unknown> = {},
) => ({ name, in: 'query' as const, schema, description, ...extra })

const pathParam = (name: string, description: string) => ({
  name,
  in: 'path' as const,
  required: true,
  schema: { type: 'string' },
  description,
})

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Ecommerce Web API',
    version: '1.0.0',
    description: [
      'API REST de una tienda de plantas construida con Express 5, TypeScript, MongoDB y Stripe.',
      '',
      '**Autenticación:** JWT con access token (15 min) y refresh token rotatorio (7 días).',
      'El access token incluye un `tokenVersion` que permite revocar sesiones al instante.',
      '',
      '**Rate limiting:** todas las rutas tienen límites por IP. Al superarlos se devuelve `429`',
      'con la cabecera `Retry-After`.',
    ].join('\n'),
    license: { name: 'MIT' },
  },
  servers: [
    { url: env.API_PREFIX, description: 'Servidor actual' },
    { url: `http://localhost:${env.PORT}${env.API_PREFIX}`, description: 'Desarrollo local' },
  ],
  tags: [
    { name: 'Sistema', description: 'Salud y disponibilidad del servicio' },
    { name: 'Productos', description: 'Catálogo público' },
    { name: 'Autenticación', description: 'Registro, sesión y gestión de tokens' },
    { name: 'Carrito', description: 'Carrito del usuario autenticado' },
    { name: 'Pedidos', description: 'Creación y consulta de pedidos' },
    { name: 'Pagos', description: 'Stripe PaymentIntent y webhook' },
    { name: 'Contenido', description: 'Blog, contacto, newsletter y club' },
    { name: 'Admin', description: 'Panel de administración (requiere rol admin)' },
  ],
  components: { securitySchemes, schemas, responses: errorResponses },

  paths: {
    '/health': {
      get: {
        tags: ['Sistema'],
        summary: 'Estado del servicio',
        description: 'No consulta la base de datos: sirve como liveness probe.',
        responses: {
          200: ok('Servicio operativo', {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'ok' },
              uptime: { type: 'number' },
              timestamp: { type: 'string', format: 'date-time' },
              storage: { type: 'string', enum: ['cloudinary', 'unconfigured'] },
            },
          }),
        },
      },
    },
    '/ready': {
      get: {
        tags: ['Sistema'],
        summary: 'Disponibilidad real',
        description: 'Comprueba la conexión con MongoDB. Readiness probe.',
        responses: {
          200: ok('Listo para recibir tráfico', {
            type: 'object',
            properties: { status: { type: 'string' }, database: { type: 'string' } },
          }),
          503: ok('Base de datos no disponible', {
            type: 'object',
            properties: { status: { type: 'string' }, database: { type: 'string' } },
          }),
        },
      },
    },

    '/products': {
      get: {
        tags: ['Productos'],
        summary: 'Listar el catálogo',
        description:
          'Los filtros admiten selección múltiple: `?category=interior&category=florales` o `?category=interior,florales`. Solo devuelve productos activos.',
        parameters: [
          query('page', { type: 'integer', minimum: 1, default: 1 }, 'Página'),
          query('limit', { type: 'integer', minimum: 1, maximum: 50, default: 12 }, 'Por página'),
          query(
            'q',
            { type: 'string', maxLength: 120 },
            'Busca en nombre, descripción y etiquetas',
          ),
          query('category', { type: 'array', items: { type: 'string' } }, 'Categorías', {
            style: 'form',
            explode: true,
          }),
          query('careLevel', { type: 'array', items: { type: 'string' } }, 'Nivel de cuidado', {
            style: 'form',
            explode: true,
          }),
          query('lightLevel', { type: 'array', items: { type: 'string' } }, 'Nivel de luz', {
            style: 'form',
            explode: true,
          }),
          query('size', { type: 'array', items: { type: 'string' } }, 'Tamaño', {
            style: 'form',
            explode: true,
          }),
          query('petFriendly', { type: 'boolean' }, 'Apto para mascotas'),
          query(
            'sort',
            { type: 'string', enum: ['featured', 'price_asc', 'price_desc'], default: 'featured' },
            'Orden',
          ),
        ],
        responses: {
          200: ok('Catálogo paginado', { $ref: '#/components/schemas/PaginatedProducts' }),
          400: { $ref: '#/components/responses/BadRequest' },
          429: { $ref: '#/components/responses/TooManyRequests' },
        },
      },
    },
    '/products/featured': {
      get: {
        tags: ['Productos'],
        summary: 'Productos destacados',
        responses: {
          200: ok('Hasta 8 productos destacados', {
            type: 'array',
            items: { $ref: '#/components/schemas/Product' },
          }),
        },
      },
    },
    '/products/related/{id}': {
      get: {
        tags: ['Productos'],
        summary: 'Productos relacionados',
        description: 'Devuelve hasta 4 productos activos de la misma categoría.',
        parameters: [pathParam('id', 'ObjectId del producto de referencia')],
        responses: {
          200: ok('Productos relacionados', {
            type: 'array',
            items: { $ref: '#/components/schemas/Product' },
          }),
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/products/slug/{slug}': {
      get: {
        tags: ['Productos'],
        summary: 'Detalle por slug',
        description: 'Ruta canónica del producto. Preferible al ObjectId para enlaces públicos.',
        parameters: [pathParam('slug', 'Slug del producto, p. ej. `monstera-deliciosa`')],
        responses: {
          200: ok('Producto', { $ref: '#/components/schemas/Product' }),
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/products/{id}': {
      get: {
        tags: ['Productos'],
        summary: 'Detalle por identificador',
        parameters: [pathParam('id', 'ObjectId del producto')],
        responses: {
          200: ok('Producto', { $ref: '#/components/schemas/Product' }),
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    '/auth/register': {
      post: {
        tags: ['Autenticación'],
        summary: 'Crear cuenta',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            properties: {
              name: { type: 'string', minLength: 2, maxLength: 120 },
              email: { type: 'string', format: 'email' },
              password: { type: 'string', minLength: 8, maxLength: 72 },
            },
            required: ['name', 'email', 'password'],
          }),
        },
        responses: {
          201: ok('Cuenta creada y sesión iniciada', wrapped('#/components/schemas/AuthSession')),
          400: { $ref: '#/components/responses/BadRequest' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión',
        description: 'Se permiten hasta 5 sesiones simultáneas; al superarlas cae la más antigua.',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string' },
            },
            required: ['email', 'password'],
          }),
        },
        responses: {
          200: ok('Sesión iniciada', wrapped('#/components/schemas/AuthSession')),
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Autenticación'],
        summary: 'Renovar la sesión',
        description:
          'Rota el refresh token. Si se presenta uno ya usado se interpreta como reutilización y se revocan **todas** las sesiones del usuario.',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            properties: { refreshToken: { type: 'string' } },
            required: ['refreshToken'],
          }),
        },
        responses: {
          200: ok('Tokens renovados', {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: { accessToken: { type: 'string' }, refreshToken: { type: 'string' } },
              },
            },
          }),
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Autenticación'],
        summary: 'Cerrar esta sesión',
        description: 'Idempotente. Las sesiones de otros dispositivos siguen activas.',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            properties: { refreshToken: { type: 'string' } },
            required: ['refreshToken'],
          }),
        },
        responses: {
          200: ok('Sesión cerrada', {
            type: 'object',
            properties: {
              data: { type: 'object', properties: { success: { type: 'boolean' } } },
            },
          }),
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Autenticación'],
        summary: 'Perfil del usuario autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          200: ok('Perfil', {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string', enum: ['user', 'admin'] },
                  activeSessions: { type: 'integer' },
                },
              },
            },
          }),
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/logout-all': {
      post: {
        tags: ['Autenticación'],
        summary: 'Cerrar todas las sesiones',
        description: 'Incrementa `tokenVersion`, invalidando también los access tokens vigentes.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: ok('Todas las sesiones cerradas', {
            type: 'object',
            properties: {
              data: { type: 'object', properties: { success: { type: 'boolean' } } },
            },
          }),
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    '/cart': {
      get: {
        tags: ['Carrito'],
        summary: 'Obtener el carrito',
        description: 'Crea uno vacío si el usuario todavía no tiene.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: ok('Carrito', wrapped('#/components/schemas/Cart')),
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/cart/items': {
      post: {
        tags: ['Carrito'],
        summary: 'Añadir un producto',
        description: 'Valida el stock sobre la cantidad **resultante**, no solo sobre la añadida.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            properties: {
              productId: { type: 'string' },
              quantity: { type: 'integer', minimum: 1, maximum: 20, default: 1 },
            },
            required: ['productId'],
          }),
        },
        responses: {
          200: ok('Carrito actualizado', wrapped('#/components/schemas/Cart')),
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/cart/items/{productId}': {
      patch: {
        tags: ['Carrito'],
        summary: 'Cambiar la cantidad',
        security: [{ bearerAuth: [] }],
        parameters: [pathParam('productId', 'ObjectId del producto')],
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            properties: { quantity: { type: 'integer', minimum: 1, maximum: 20 } },
            required: ['quantity'],
          }),
        },
        responses: {
          200: ok('Carrito actualizado', wrapped('#/components/schemas/Cart')),
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
      delete: {
        tags: ['Carrito'],
        summary: 'Quitar un producto',
        security: [{ bearerAuth: [] }],
        parameters: [pathParam('productId', 'ObjectId del producto')],
        responses: {
          200: ok('Carrito actualizado', wrapped('#/components/schemas/Cart')),
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/cart/clear': {
      delete: {
        tags: ['Carrito'],
        summary: 'Vaciar el carrito',
        security: [{ bearerAuth: [] }],
        responses: {
          200: ok('Carrito vacío', wrapped('#/components/schemas/Cart')),
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    '/orders': {
      post: {
        tags: ['Pedidos'],
        summary: 'Crear un pedido desde el carrito',
        description:
          'Revalida precios y disponibilidad **contra el catálogo**, no contra el carrito: los precios congelados al añadir productos no se usan para cobrar.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            properties: { shippingAddress: { $ref: '#/components/schemas/ShippingAddress' } },
            required: ['shippingAddress'],
          }),
        },
        responses: {
          201: ok('Pedido creado', wrapped('#/components/schemas/Order')),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
      get: {
        tags: ['Pedidos'],
        summary: 'Listar mis pedidos',
        security: [{ bearerAuth: [] }],
        parameters: [
          query('page', { type: 'integer', minimum: 1, default: 1 }, 'Página'),
          query('limit', { type: 'integer', minimum: 1, maximum: 50, default: 20 }, 'Por página'),
          query(
            'includePending',
            { type: 'boolean', default: false },
            'Incluir pedidos pendientes de pago',
          ),
        ],
        responses: {
          200: ok('Pedidos paginados', {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  items: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
                  page: { type: 'integer' },
                  limit: { type: 'integer' },
                  total: { type: 'integer' },
                  totalPages: { type: 'integer' },
                },
              },
            },
          }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/orders/{id}': {
      get: {
        tags: ['Pedidos'],
        summary: 'Detalle de un pedido',
        security: [{ bearerAuth: [] }],
        parameters: [pathParam('id', 'ObjectId del pedido')],
        responses: {
          200: ok('Pedido', wrapped('#/components/schemas/Order')),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    '/payments/intents': {
      post: {
        tags: ['Pagos'],
        summary: 'Crear un PaymentIntent de Stripe',
        description:
          'Idempotente: si el pedido ya tiene un intent utilizable se reutiliza en lugar de crear otro.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            properties: {
              orderId: { type: 'string' },
              idempotencyKey: { type: 'string', minLength: 8, maxLength: 120 },
            },
            required: ['orderId'],
          }),
        },
        responses: {
          200: ok('Intent listo', wrapped('#/components/schemas/PaymentIntent')),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/payments/webhook': {
      post: {
        tags: ['Pagos'],
        summary: 'Webhook de Stripe',
        description: [
          'Lo llama Stripe, no el frontend. Requiere la cabecera `Stripe-Signature`.',
          '',
          'Al confirmarse el pago se ejecuta una **transacción** que marca el pedido como pagado,',
          'descuenta el stock y vacía el carrito. Los eventos se registran por `event.id`, así que',
          'una reentrega no vuelve a descontar stock.',
        ].join('\n'),
        parameters: [
          {
            name: 'Stripe-Signature',
            in: 'header',
            required: true,
            schema: { type: 'string' },
            description: 'Firma del evento, verificada con STRIPE_WEBHOOK_SECRET',
          },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: {
          200: ok('Evento procesado', {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  received: { type: 'boolean' },
                  eventType: { type: 'string' },
                  duplicate: { type: 'boolean', description: 'true si el evento ya se procesó' },
                },
              },
            },
          }),
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },

    '/blog': {
      get: {
        tags: ['Contenido'],
        summary: 'Listar artículos del blog',
        parameters: [
          query('page', { type: 'integer', minimum: 1, default: 1 }, 'Página'),
          query('limit', { type: 'integer', minimum: 1, maximum: 20, default: 6 }, 'Por página'),
          query('category', { type: 'string' }, 'Categoría'),
        ],
        responses: { 200: ok('Artículos paginados', { type: 'object' }) },
      },
    },
    '/blog/{slug}': {
      get: {
        tags: ['Contenido'],
        summary: 'Detalle de un artículo',
        parameters: [pathParam('slug', 'Slug del artículo')],
        responses: {
          200: ok('Artículo', { type: 'object' }),
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/contact/messages': {
      post: {
        tags: ['Contenido'],
        summary: 'Enviar un mensaje de contacto',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            properties: {
              name: { type: 'string', minLength: 2, maxLength: 120 },
              email: { type: 'string', format: 'email' },
              message: { type: 'string', minLength: 8, maxLength: 2000 },
            },
            required: ['name', 'email', 'message'],
          }),
        },
        responses: {
          201: ok('Mensaje registrado', { type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
          429: { $ref: '#/components/responses/TooManyRequests' },
        },
      },
    },
    '/newsletter/subscribe': {
      post: {
        tags: ['Contenido'],
        summary: 'Suscribirse a la newsletter',
        description:
          'Idempotente: suscribirse dos veces con el mismo correo no duplica el registro.',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            properties: { email: { type: 'string', format: 'email' } },
            required: ['email'],
          }),
        },
        responses: {
          201: ok('Suscripción registrada', { type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/club/leads': {
      post: {
        tags: ['Contenido'],
        summary: 'Registrar interés en el club',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              plan: { type: 'string', enum: ['basic', 'medio', 'premium'] },
            },
            required: ['name', 'email', 'plan'],
          }),
        },
        responses: {
          201: ok('Lead registrado', { type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },

    '/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Indicadores del panel',
        security: [{ bearerAuth: [] }],
        responses: {
          200: ok('KPIs', wrapped('#/components/schemas/AdminStats')),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/admin/products': {
      get: {
        tags: ['Admin'],
        summary: 'Listar productos (incluidos los dados de baja)',
        security: [{ bearerAuth: [] }],
        parameters: [
          query('page', { type: 'integer', default: 1 }, 'Página'),
          query('limit', { type: 'integer', maximum: 100, default: 20 }, 'Por página'),
          query('q', { type: 'string' }, 'Busca en nombre y slug'),
        ],
        responses: {
          200: ok('Productos', { type: 'object' }),
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Crear un producto',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: json({ $ref: '#/components/schemas/Product' }),
        },
        responses: {
          201: ok('Producto creado', { type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
          403: { $ref: '#/components/responses/Forbidden' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/admin/products/{id}': {
      patch: {
        tags: ['Admin'],
        summary: 'Editar un producto',
        security: [{ bearerAuth: [] }],
        parameters: [pathParam('id', 'ObjectId del producto')],
        requestBody: { required: true, content: json({ type: 'object' }) },
        responses: {
          200: ok('Producto actualizado', { type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Dar de baja un producto',
        description:
          '**Baja lógica**: marca `isActive: false`. Nunca se borra el documento, porque los pedidos históricos lo referencian.',
        security: [{ bearerAuth: [] }],
        parameters: [pathParam('id', 'ObjectId del producto')],
        responses: {
          200: ok('Producto dado de baja', { type: 'object' }),
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/admin/products/{id}/images': {
      post: {
        tags: ['Admin'],
        summary: 'Subir una imagen a Cloudinary',
        description:
          'JPEG, PNG o WebP. Máximo 5 MB. Devuelve 503 si Cloudinary no está configurado.',
        security: [{ bearerAuth: [] }],
        parameters: [pathParam('id', 'ObjectId del producto')],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { image: { type: 'string', format: 'binary' } },
                required: ['image'],
              },
            },
          },
        },
        responses: {
          201: ok('Imagen añadida', { type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
          403: { $ref: '#/components/responses/Forbidden' },
          503: ok('Cloudinary no configurado', { $ref: '#/components/schemas/ErrorResponse' }),
        },
      },
    },
    '/admin/products/{id}/images/{publicId}': {
      delete: {
        tags: ['Admin'],
        summary: 'Eliminar una imagen',
        security: [{ bearerAuth: [] }],
        parameters: [
          pathParam('id', 'ObjectId del producto'),
          pathParam('publicId', 'Identificador en Cloudinary (URL-encoded)'),
        ],
        responses: {
          200: ok('Imagen eliminada', { type: 'object' }),
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/admin/orders': {
      get: {
        tags: ['Admin'],
        summary: 'Listar todos los pedidos',
        security: [{ bearerAuth: [] }],
        parameters: [
          query('page', { type: 'integer', default: 1 }, 'Página'),
          query('limit', { type: 'integer', maximum: 100, default: 20 }, 'Por página'),
          query('status', { $ref: '#/components/schemas/OrderStatus' }, 'Filtrar por estado'),
          query('q', { type: 'string' }, 'Busca por nombre o correo del cliente'),
        ],
        responses: {
          200: ok('Pedidos', { type: 'object' }),
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/admin/orders/{id}/status': {
      patch: {
        tags: ['Admin'],
        summary: 'Cambiar el estado de un pedido',
        description: 'Valida la máquina de estados; una transición no permitida devuelve 409.',
        security: [{ bearerAuth: [] }],
        parameters: [pathParam('id', 'ObjectId del pedido')],
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            properties: { status: { $ref: '#/components/schemas/OrderStatus' } },
            required: ['status'],
          }),
        },
        responses: {
          200: ok('Estado actualizado', { type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'Listar usuarios',
        security: [{ bearerAuth: [] }],
        parameters: [
          query('page', { type: 'integer', default: 1 }, 'Página'),
          query('limit', { type: 'integer', maximum: 100, default: 20 }, 'Por página'),
          query('q', { type: 'string' }, 'Busca por nombre o correo'),
        ],
        responses: {
          200: ok('Usuarios', { type: 'object' }),
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/admin/contact-messages': {
      get: {
        tags: ['Admin'],
        summary: 'Bandeja de mensajes de contacto',
        security: [{ bearerAuth: [] }],
        responses: {
          200: ok('Mensajes', { type: 'object' }),
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/admin/club-leads': {
      get: {
        tags: ['Admin'],
        summary: 'Leads del club',
        security: [{ bearerAuth: [] }],
        responses: {
          200: ok('Leads', { type: 'object' }),
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
  },
} as const
