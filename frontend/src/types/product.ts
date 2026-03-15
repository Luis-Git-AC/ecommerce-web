export type ProductCategory = string

export type ProductCareLevel = string

export type ProductLightRequired = string

export type ProductSize = string

export type ProductImage = {
  src: string
  webp?: string
  jpg?: string
}

export type Product = {
  id: string
  name: string
  price: string
  category: ProductCategory
  careLevel: ProductCareLevel
  lightRequired: ProductLightRequired
  petSafe: boolean
  size: ProductSize
  images: {
    card: ProductImage
    gallery: ProductImage[]
  }
}
