export type ProductCategory = 'suculenta' | 'tropical' | 'cactus' | 'trepadora'

export type ProductCareLevel = 'facil' | 'moderado' | 'experto'

export type ProductLightRequired = 'baja' | 'media' | 'alta'

export type ProductSize = 'pequena' | 'mediana' | 'grande'

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
