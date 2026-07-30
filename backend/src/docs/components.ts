export const securitySchemes = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description:
      'Access token devuelto por /auth/login o /auth/register. Caduca a los 15 minutos; usa /auth/refresh para renovarlo.',
  },
} as const

export const errorResponses = {
  BadRequest: {
    description: 'Payload o parámetros no válidos',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
        example: { message: 'Invalid payload for register', requestId: 'a1b2c3' },
      },
    },
  },
  Unauthorized: {
    description: 'Falta el token, no es válido o la sesión ha sido revocada',
    content: {
      'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
    },
  },
  Forbidden: {
    description: 'Autenticado pero sin permisos suficientes (se requiere rol admin)',
    content: {
      'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
    },
  },
  NotFound: {
    description: 'El recurso no existe',
    content: {
      'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
    },
  },
  Conflict: {
    description: 'Conflicto con el estado actual (stock, duplicados, transición no permitida)',
    content: {
      'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
    },
  },
  TooManyRequests: {
    description: 'Se ha superado el límite de peticiones',
    content: {
      'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
    },
  },
} as const

export const schemas = {
  ErrorResponse: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Producto no encontrado' },
      requestId: { type: 'string', description: 'Identificador de la petición, útil para soporte' },
    },
    required: ['message'],
  },

  ProductImage: {
    type: 'object',
    properties: {
      url: { type: 'string', format: 'uri' },
      alt: { type: 'string' },
      publicId: { type: 'string', description: 'Identificador en Cloudinary' },
    },
    required: ['url', 'alt'],
  },

  Product: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '6a6211cd996b9b0151a02438' },
      slug: { type: 'string', example: 'monstera-deliciosa' },
      name: { type: 'string' },
      description: { type: 'string' },
      price: { type: 'number', format: 'float', example: 29.9 },
      currency: { type: 'string', example: 'EUR' },
      category: { type: 'string', enum: ['suculentas', 'interior', 'florales', 'colgantes'] },
      careLevel: { type: 'string', enum: ['easy', 'medium', 'hard'] },
      lightLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
      size: { type: 'string', enum: ['xs', 's', 'm', 'l', 'xl'] },
      petFriendly: { type: 'boolean' },
      isFeatured: { type: 'boolean' },
      stock: { type: 'integer', minimum: 0 },
      isActive: { type: 'boolean' },
      images: { type: 'array', items: { $ref: '#/components/schemas/ProductImage' } },
      tags: { type: 'array', items: { type: 'string' } },
    },
  },

  PaginatedProducts: {
    type: 'object',
    properties: {
      items: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
      total: { type: 'integer' },
      page: { type: 'integer' },
      limit: { type: 'integer' },
      totalPages: { type: 'integer' },
    },
  },

  CartItem: {
    type: 'object',
    properties: {
      productId: { type: 'string' },
      slug: { type: 'string' },
      name: { type: 'string' },
      image: { type: 'string', format: 'uri' },
      quantity: { type: 'integer', minimum: 1, maximum: 20 },
      unitPrice: { type: 'number' },
      currency: { type: 'string' },
      lineTotal: { type: 'number' },
    },
  },

  Cart: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      userId: { type: 'string' },
      items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
      subtotal: { type: 'number' },
      total: { type: 'number' },
      totalItems: { type: 'integer' },
    },
  },

  ShippingAddress: {
    type: 'object',
    properties: {
      fullName: { type: 'string', minLength: 3, maxLength: 120 },
      line1: { type: 'string', minLength: 4, maxLength: 160 },
      line2: { type: 'string', maxLength: 160 },
      city: { type: 'string', minLength: 2, maxLength: 80 },
      postalCode: { type: 'string', pattern: '^\\d{5}$', example: '28013' },
      province: { type: 'string', minLength: 2, maxLength: 80 },
      country: { type: 'string', minLength: 2, maxLength: 2, default: 'ES' },
      phone: { type: 'string', example: '+34 600 123 456' },
    },
    required: ['fullName', 'line1', 'city', 'postalCode', 'province', 'phone'],
  },

  OrderStatus: {
    type: 'string',
    enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'failed', 'canceled'],
    description:
      'Transiciones permitidas: pending→paid|failed|canceled · paid→processing|canceled · processing→shipped · shipped→delivered',
  },

  Order: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      userId: { type: 'string' },
      shippingAddress: { $ref: '#/components/schemas/ShippingAddress' },
      status: { $ref: '#/components/schemas/OrderStatus' },
      currency: { type: 'string' },
      subtotal: { type: 'number' },
      total: { type: 'number' },
      paymentIntentId: { type: 'string' },
      paymentLastError: { type: 'string' },
      paidAt: { type: 'string', format: 'date-time' },
      items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  AuthSession: {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['user', 'admin'] },
        },
      },
      accessToken: { type: 'string', description: 'JWT de acceso, caduca en 15 minutos' },
      refreshToken: { type: 'string', description: 'JWT de refresco, caduca en 7 días' },
    },
  },

  PaymentIntent: {
    type: 'object',
    properties: {
      orderId: { type: 'string' },
      status: { $ref: '#/components/schemas/OrderStatus' },
      currency: { type: 'string' },
      total: { type: 'number' },
      paymentIntentId: { type: 'string', example: 'pi_3Ox...' },
      clientSecret: { type: 'string', description: 'Se pasa a Stripe Elements en el frontend' },
    },
  },

  AdminStats: {
    type: 'object',
    properties: {
      revenue: {
        type: 'object',
        properties: {
          total: { type: 'number' },
          paidOrders: { type: 'integer' },
          currency: { type: 'string' },
        },
      },
      ordersByStatus: { type: 'object', additionalProperties: { type: 'integer' } },
      topProducts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            slug: { type: 'string' },
            name: { type: 'string' },
            units: { type: 'integer' },
            revenue: { type: 'number' },
          },
        },
      },
      newUsersLast30Days: { type: 'integer' },
      lowStockProducts: { type: 'integer' },
      totals: {
        type: 'object',
        properties: {
          activeProducts: { type: 'integer' },
          totalUsers: { type: 'integer' },
          totalOrders: { type: 'integer' },
        },
      },
    },
  },
} as const
