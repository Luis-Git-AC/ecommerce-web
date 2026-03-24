import bcrypt from 'bcryptjs'
import { Types } from 'mongoose'
import { connectToDatabase, disconnectDatabase } from '../src/config/db'
import { logger } from '../src/config/logger'
import { UserModel } from '../src/modules/auth/schemas/user.schema'
import { ProductModel } from '../src/modules/products/schemas/product.schema'
import { OrderModel } from '../src/modules/orders/schemas/order.schema'

const SALT_ROUNDS = 12

const demoUser = {
  name: 'Demo Customer',
  email: 'demo.customer@ecommerce.local',
  password: 'Demo12345!',
}

async function seedDemoData() {
  await connectToDatabase()

  try {
    const products = await ProductModel.find({}).sort({ isFeatured: -1, createdAt: -1 }).limit(2).lean()

    if (products.length < 2) {
      throw new Error('At least 2 products are required to seed demo orders')
    }

    const passwordHash = await bcrypt.hash(demoUser.password, SALT_ROUNDS)

    const user = await UserModel.findOneAndUpdate(
      { email: demoUser.email },
      {
        name: demoUser.name,
        email: demoUser.email,
        role: 'user',
        passwordHash,
        refreshTokenHash: undefined,
      },
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
      },
    )

    await OrderModel.deleteMany({ userId: user._id })

    const paidItem = products[0]
    const failedItem = products[1]

    const paidQuantity = 1
    const failedQuantity = 2

    const paidLineTotal = paidItem.price * paidQuantity
    const failedLineTotal = failedItem.price * failedQuantity

    const now = Date.now()

    const paidOrder = await OrderModel.create({
      userId: user._id,
      items: [
        {
          productId: new Types.ObjectId(String(paidItem._id)),
          slug: paidItem.slug,
          name: paidItem.name,
          image: paidItem.images[0]?.url ?? '',
          quantity: paidQuantity,
          unitPrice: paidItem.price,
          currency: 'EUR',
          lineTotal: paidLineTotal,
        },
      ],
      subtotal: paidLineTotal,
      total: paidLineTotal,
      currency: 'EUR',
      status: 'paid',
      paymentIntentId: `pi_demo_paid_${now}`,
      paymentLastError: undefined,
      paidAt: new Date(now - 60_000),
    })

    const failedOrder = await OrderModel.create({
      userId: user._id,
      items: [
        {
          productId: new Types.ObjectId(String(failedItem._id)),
          slug: failedItem.slug,
          name: failedItem.name,
          image: failedItem.images[0]?.url ?? '',
          quantity: failedQuantity,
          unitPrice: failedItem.price,
          currency: 'EUR',
          lineTotal: failedLineTotal,
        },
      ],
      subtotal: failedLineTotal,
      total: failedLineTotal,
      currency: 'EUR',
      status: 'failed',
      paymentIntentId: `pi_demo_failed_${now}`,
      paymentLastError: 'Card was declined',
    })

    logger.info(
      {
        demoUser: {
          id: String(user._id),
          email: user.email,
          role: user.role,
        },
        orders: [
          { id: String(paidOrder._id), status: paidOrder.status, total: paidOrder.total, currency: paidOrder.currency },
          { id: String(failedOrder._id), status: failedOrder.status, total: failedOrder.total, currency: failedOrder.currency },
        ],
      },
      'Demo seed completed',
    )
  } finally {
    await disconnectDatabase()
  }
}

seedDemoData().catch((error) => {
  logger.error(error, 'Demo seed failed')
  process.exit(1)
})
