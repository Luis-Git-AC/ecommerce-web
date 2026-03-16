import { Types } from 'mongoose'
import { HttpError } from '../../../common/errors/http-error'
import { ProductModel } from '../../products/schemas/product.schema'
import { addCartItemSchema, updateCartItemSchema } from '../dto/cart.dto'
import { CartModel } from '../schemas/cart.schema'

export class CartService {
  async getCart(userId: string) {
    const cart = await this.findOrCreateCart(userId)
    return this.toCartResponse(cart)
  }

  async addItem(userId: string, rawBody: unknown) {
    const parsed = addCartItemSchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid payload for cart item')
    }

    const productId = parsed.data.productId
    if (!Types.ObjectId.isValid(productId)) {
      throw new HttpError(400, 'Invalid product id')
    }

    const product = await ProductModel.findById(productId).lean()
    if (!product) {
      throw new HttpError(404, 'Product not found')
    }

    const cart = await this.findOrCreateCart(userId)

    const existingItem = cart.items.find((item) => String(item.productId) === productId)
    if (existingItem) {
      existingItem.quantity += parsed.data.quantity
      existingItem.lineTotal = this.toMoney(existingItem.quantity * existingItem.unitPrice)
    } else {
      cart.items.push({
        productId: new Types.ObjectId(productId),
        slug: product.slug,
        name: product.name,
        image: product.images[0]?.url ?? '',
        quantity: parsed.data.quantity,
        unitPrice: product.price,
        currency: product.currency,
        lineTotal: this.toMoney(parsed.data.quantity * product.price),
      })
    }

    this.recalculate(cart)
    await cart.save()

    return this.toCartResponse(cart)
  }

  async updateItem(userId: string, productId: string, rawBody: unknown) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new HttpError(400, 'Invalid product id')
    }

    const parsed = updateCartItemSchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid payload for cart item update')
    }

    const cart = await this.findOrCreateCart(userId)
    const item = cart.items.find((candidate) => String(candidate.productId) === productId)

    if (!item) {
      throw new HttpError(404, 'Cart item not found')
    }

    item.quantity = parsed.data.quantity
    item.lineTotal = this.toMoney(item.quantity * item.unitPrice)

    this.recalculate(cart)
    await cart.save()

    return this.toCartResponse(cart)
  }

  async removeItem(userId: string, productId: string) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new HttpError(400, 'Invalid product id')
    }

    const cart = await this.findOrCreateCart(userId)
    const itemIndex = cart.items.findIndex((item) => String(item.productId) === productId)

    if (itemIndex < 0) {
      throw new HttpError(404, 'Cart item not found')
    }

    cart.items.splice(itemIndex, 1)
    this.recalculate(cart)
    await cart.save()

    return this.toCartResponse(cart)
  }

  async clear(userId: string) {
    const cart = await this.findOrCreateCart(userId)
    cart.items.splice(0, cart.items.length)
    this.recalculate(cart)
    await cart.save()

    return this.toCartResponse(cart)
  }

  private async findOrCreateCart(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new HttpError(401, 'Unauthorized')
    }

    const objectUserId = new Types.ObjectId(userId)
    const existing = await CartModel.findOne({ userId: objectUserId })
    if (existing) {
      return existing
    }

    return CartModel.create({
      userId: objectUserId,
      items: [],
      subtotal: 0,
      total: 0,
    })
  }

  private recalculate(cart: Awaited<ReturnType<CartService['findOrCreateCart']>>) {
    let subtotal = 0

    for (const item of cart.items) {
      item.lineTotal = this.toMoney(item.unitPrice * item.quantity)
      subtotal += item.lineTotal
    }

    cart.subtotal = this.toMoney(subtotal)
    cart.total = cart.subtotal
  }

  private toCartResponse(cart: Awaited<ReturnType<CartService['findOrCreateCart']>>) {
    return {
      id: String(cart._id),
      userId: String(cart.userId),
      items: cart.items.map((item) => ({
        productId: String(item.productId),
        slug: item.slug,
        name: item.name,
        image: item.image,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        currency: item.currency,
        lineTotal: item.lineTotal,
      })),
      subtotal: cart.subtotal,
      total: cart.total,
      totalItems: cart.items.reduce((acc, item) => acc + item.quantity, 0),
    }
  }

  private toMoney(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100
  }
}
