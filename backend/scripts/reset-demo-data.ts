import { connectToDatabase, disconnectDatabase } from '../src/config/db'
import { logger } from '../src/config/logger'
import { UserModel } from '../src/modules/auth/schemas/user.schema'
import { CartModel } from '../src/modules/cart/schemas/cart.schema'
import { OrderModel } from '../src/modules/orders/schemas/order.schema'
import { ProductModel } from '../src/modules/products/schemas/product.schema'
import { BlogPostModel } from '../src/modules/content/schemas/blog-post.schema'
import { ContactMessageModel } from '../src/modules/content/schemas/contact-message.schema'
import { NewsletterSubscriberModel } from '../src/modules/content/schemas/newsletter-subscriber.schema'
import { ClubLeadModel } from '../src/modules/content/schemas/club-lead.schema'

async function resetDemoData() {
  await connectToDatabase()

  try {
    const [users, carts, orders, products, blogPosts, contacts, newsletters, clubLeads] = await Promise.all([
      UserModel.deleteMany({}),
      CartModel.deleteMany({}),
      OrderModel.deleteMany({}),
      ProductModel.deleteMany({}),
      BlogPostModel.deleteMany({}),
      ContactMessageModel.deleteMany({}),
      NewsletterSubscriberModel.deleteMany({}),
      ClubLeadModel.deleteMany({}),
    ])

    logger.info(
      {
        usersDeleted: users.deletedCount,
        cartsDeleted: carts.deletedCount,
        ordersDeleted: orders.deletedCount,
        productsDeleted: products.deletedCount,
        blogPostsDeleted: blogPosts.deletedCount,
        contactsDeleted: contacts.deletedCount,
        newslettersDeleted: newsletters.deletedCount,
        clubLeadsDeleted: clubLeads.deletedCount,
      },
      'Demo reset completed',
    )
  } finally {
    await disconnectDatabase()
  }
}

resetDemoData().catch((error) => {
  logger.error(error, 'Demo reset failed')
  process.exit(1)
})
