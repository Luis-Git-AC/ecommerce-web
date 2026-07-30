import { Router } from 'express'
import multer from 'multer'
import { requireAdmin, requireAuth } from '../../common/middlewares/auth.middleware'
import { createRateLimitMiddleware } from '../../common/middlewares/rate-limit.middleware'
import { HttpError } from '../../common/errors/http-error'
import { AdminController } from './controllers/admin.controller'
import { AdminWriteController } from './controllers/admin-write.controller'

const adminController = new AdminController()
const adminWriteController = new AdminWriteController()

const adminReadRateLimit = createRateLimitMiddleware({
  keyPrefix: 'admin-read',
  windowMs: 15 * 60 * 1000,
  maxRequests: 120,
})

const adminWriteRateLimit = createRateLimitMiddleware({
  keyPrefix: 'admin-write',
  windowMs: 15 * 60 * 1000,
  maxRequests: 60,
})

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      callback(new HttpError(400, 'Formato no admitido. Usa JPEG, PNG o WebP.'))
      return
    }

    callback(null, true)
  },
})

export const adminRouter = Router()

adminRouter.use('/admin', requireAuth, requireAdmin)

adminRouter.get('/admin/users', adminReadRateLimit, adminController.listUsers)
adminRouter.get('/admin/orders', adminReadRateLimit, adminController.listOrders)
adminRouter.get('/admin/products', adminReadRateLimit, adminWriteController.listProducts)
adminRouter.get('/admin/stats', adminReadRateLimit, adminWriteController.getStats)
adminRouter.get(
  '/admin/contact-messages',
  adminReadRateLimit,
  adminWriteController.listContactMessages,
)
adminRouter.get('/admin/club-leads', adminReadRateLimit, adminWriteController.listClubLeads)

adminRouter.post('/admin/products', adminWriteRateLimit, adminWriteController.createProduct)
adminRouter.patch('/admin/products/:id', adminWriteRateLimit, adminWriteController.updateProduct)
adminRouter.delete(
  '/admin/products/:id',
  adminWriteRateLimit,
  adminWriteController.deactivateProduct,
)
adminRouter.post(
  '/admin/products/:id/images',
  adminWriteRateLimit,
  upload.single('image'),
  adminWriteController.uploadProductImage,
)
adminRouter.delete(
  '/admin/products/:id/images/:publicId',
  adminWriteRateLimit,
  adminWriteController.deleteProductImage,
)
adminRouter.patch(
  '/admin/orders/:id/status',
  adminWriteRateLimit,
  adminWriteController.updateOrderStatus,
)
