import { cloudinary, isCloudinaryConfigured } from '../../../config/cloudinary'

type ProductImage = {
  url: string
  alt: string
  publicId?: string
}

type DeliveryContext = 'listing' | 'detail'

const LISTING_CARD_TRANSFORMATION = [
  { quality: 'auto', fetch_format: 'auto', crop: 'fill', gravity: 'auto', width: 640, height: 640 },
]

const LISTING_GALLERY_TRANSFORMATION = [
  { quality: 'auto', fetch_format: 'auto', crop: 'fill', gravity: 'auto', width: 320, height: 320 },
]

const DETAIL_TRANSFORMATION = [
  { quality: 'auto', fetch_format: 'auto', crop: 'limit', width: 1400, height: 1400 },
]

function getTransformForImage(index: number, context: DeliveryContext) {
  if (context === 'detail') {
    return DETAIL_TRANSFORMATION
  }

  return index === 0 ? LISTING_CARD_TRANSFORMATION : LISTING_GALLERY_TRANSFORMATION
}

function toOptimizedUrl(image: ProductImage, index: number, context: DeliveryContext): string {
  if (!isCloudinaryConfigured || !image.publicId) {
    return image.url
  }

  return cloudinary.url(image.publicId, {
    secure: true,
    transformation: getTransformForImage(index, context),
  })
}

export function optimizeProductImages(images: ProductImage[], context: DeliveryContext): ProductImage[] {
  return images.map((image, index) => ({
    ...image,
    url: toOptimizedUrl(image, index, context),
  }))
}
