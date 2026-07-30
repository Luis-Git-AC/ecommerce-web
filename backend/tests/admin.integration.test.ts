import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../src/app.js'
import { connectToDatabase, disconnectDatabase } from '../src/config/db.js'
import { OrderModel } from '../src/modules/orders/schemas/order.schema.js'

import type { OrderStatus } from '../src/modules/orders/schemas/order.schema.js'
import { ProductModel } from '../src/modules/products/schemas/product.schema.js'
import { UserModel } from '../src/modules/auth/schemas/user.schema.js'
import { validShippingAddress } from './fixtures.js'

const suffix = `a${Date.now()}`

let adminToken = ''
let userToken = ''

const baseProduct = {
  name: 'Producto Admin',
  description: 'Producto creado desde el panel de administración',
  price: 24.5,
  currency: 'EUR',
  category: 'interior',
  careLevel: 'easy',
  lightLevel: 'medium',
  size: 'm',
  petFriendly: true,
  isFeatured: false,
  stock: 12,
  isActive: true,
  images: [{ url: 'https://example.com/admin.jpg', alt: 'Producto Admin' }],
  tags: ['admin'],
}

describe('Panel de administración', () => {
  beforeAll(async () => {
    await connectToDatabase()

    const adminRegister = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Admin Test',
        email: `test.admin.${suffix}@example.com`,
        password: 'Password123!',
      })
    expect(adminRegister.status).toBe(201)

    // El rol admin se asigna en base de datos (no hay endpoint de escalada).
    await UserModel.updateOne({ _id: adminRegister.body.data.user.id }, { $set: { role: 'admin' } })

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: `test.admin.${suffix}@example.com`, password: 'Password123!' })
    adminToken = adminLogin.body.data.accessToken

    const userRegister = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Usuario Normal',
        email: `test.normal.${suffix}@example.com`,
        password: 'Password123!',
      })
    userToken = userRegister.body.data.accessToken
  })

  afterAll(async () => {
    await ProductModel.deleteMany({ slug: { $regex: `-${suffix}$` } })
    await disconnectDatabase()
  })

  describe('Permisos', () => {
    it('rechaza el acceso sin token', async () => {
      const response = await request(app).get('/api/admin/products')
      expect(response.status).toBe(401)
    })

    it('rechaza a un usuario sin rol admin', async () => {
      const response = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${userToken}`)
      expect(response.status).toBe(403)
    })

    it('impide que un usuario normal cree productos', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ...baseProduct, slug: `intruso-${suffix}` })
      expect(response.status).toBe(403)
    })
  })

  describe('CRUD de productos', () => {
    it('crea un producto', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...baseProduct, slug: `nuevo-${suffix}` })

      expect(response.status).toBe(201)
      expect(response.body.data).toMatchObject({
        slug: `nuevo-${suffix}`,
        stock: 12,
        isActive: true,
      })
    })

    it('rechaza un slug duplicado', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...baseProduct, slug: `nuevo-${suffix}` })

      expect(response.status).toBe(409)
      expect(response.body.message).toContain('Ya existe un producto')
    })

    it('rechaza un slug con formato invalido', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...baseProduct, slug: 'Slug Con Mayusculas Y Espacios' })

      expect(response.status).toBe(400)
      expect(response.body.message).toContain('slug')
    })

    it('exige al menos una imagen', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...baseProduct, slug: `sin-imagen-${suffix}`, images: [] })

      expect(response.status).toBe(400)
      expect(response.body.message).toContain('al menos una imagen')
    })

    it('actualiza precio y stock', async () => {
      const product = await ProductModel.create({ ...baseProduct, slug: `editar-${suffix}` })

      const response = await request(app)
        .patch(`/api/admin/products/${String(product._id)}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 39.9, stock: 3 })

      expect(response.status).toBe(200)
      expect(response.body.data.price).toBe(39.9)
      expect(response.body.data.stock).toBe(3)
    })

    it('aplica baja logica en lugar de borrado fisico', async () => {
      const product = await ProductModel.create({ ...baseProduct, slug: `baja-${suffix}` })

      const response = await request(app)
        .delete(`/api/admin/products/${String(product._id)}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.isActive).toBe(false)

      // El documento sigue existiendo: los pedidos historicos lo referencian.
      const stillThere = await ProductModel.findById(product._id).lean()
      expect(stillThere).not.toBeNull()

      // Pero desaparece del catalogo publico.
      const publicDetail = await request(app).get(`/api/products/${String(product._id)}`)
      expect(publicDetail.status).toBe(404)
    })

    it('el panel si muestra los productos inactivos', async () => {
      const response = await request(app)
        .get(`/api/admin/products?q=baja-${suffix}&limit=50`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      const slugs = response.body.data.items.map((item: { slug: string }) => item.slug)
      expect(slugs).toContain(`baja-${suffix}`)
    })

    it('devuelve 503 al subir imagen si Cloudinary no esta configurado', async () => {
      const product = await ProductModel.create({ ...baseProduct, slug: `imagen-${suffix}` })

      const response = await request(app)
        .post(`/api/admin/products/${String(product._id)}/images`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', Buffer.from('imagen-falsa'), {
          filename: 'planta.jpg',
          contentType: 'image/jpeg',
        })

      // El entorno de test no tiene credenciales de Cloudinary: se espera un
      // error explicito, no un fallo opaco del SDK.
      expect(response.status).toBe(503)
      expect(response.body.message).toContain('Cloudinary')
    })

    it('rechaza un formato de imagen no admitido', async () => {
      const product = await ProductModel.create({ ...baseProduct, slug: `formato-${suffix}` })

      const response = await request(app)
        .post(`/api/admin/products/${String(product._id)}/images`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', Buffer.from('no-soy-una-imagen'), {
          filename: 'documento.pdf',
          contentType: 'application/pdf',
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toContain('Formato no admitido')
    })
  })

  describe('Estados de pedido', () => {
    const createOrder = (status: OrderStatus) =>
      OrderModel.create({
        userId: '6a6211cd996b9b0151a02438',
        shippingAddress: validShippingAddress,
        items: [
          {
            productId: '6a6211cd996b9b0151a02439',
            slug: `estado-${suffix}`,
            name: 'Producto Estado',
            image: 'https://example.com/e.jpg',
            quantity: 1,
            unitPrice: 20,
            currency: 'EUR',
            lineTotal: 20,
          },
        ],
        subtotal: 20,
        total: 20,
        currency: 'EUR',
        status,
      })

    it('permite pasar de pagado a en preparacion', async () => {
      const order = await createOrder('paid')

      const response = await request(app)
        .patch(`/api/admin/orders/${String(order._id)}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'processing' })

      expect(response.status).toBe(200)
      expect(response.body.data.status).toBe('processing')
      expect(response.body.data.previousStatus).toBe('paid')
    })

    it('rechaza saltarse pasos de la maquina de estados', async () => {
      const order = await createOrder('pending')

      const response = await request(app)
        .patch(`/api/admin/orders/${String(order._id)}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'delivered' })

      expect(response.status).toBe(409)
      expect(response.body.message).toContain('No se puede pasar')
    })

    it('rechaza modificar un estado final', async () => {
      const order = await createOrder('delivered')

      const response = await request(app)
        .patch(`/api/admin/orders/${String(order._id)}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'shipped' })

      expect(response.status).toBe(409)
      expect(response.body.message).toContain('estado final')
    })

    it('rechaza un estado inexistente', async () => {
      const order = await createOrder('paid')

      const response = await request(app)
        .patch(`/api/admin/orders/${String(order._id)}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'teletransportado' })

      expect(response.status).toBe(400)
    })
  })

  describe('Indicadores', () => {
    it('devuelve los KPIs del panel', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveProperty('revenue.total')
      expect(response.body.data).toHaveProperty('ordersByStatus')
      expect(response.body.data).toHaveProperty('totals.activeProducts')
      expect(Array.isArray(response.body.data.topProducts)).toBe(true)
    })

    it('lista la bandeja de mensajes de contacto', async () => {
      const response = await request(app)
        .get('/api/admin/contact-messages')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body.data.items)).toBe(true)
    })
  })
})
