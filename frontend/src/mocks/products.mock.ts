export type ProductMock = {
  id: string
  name: string
  price: string
  category: 'suculenta' | 'tropical' | 'cactus' | 'trepadora'
  careLevel: 'facil' | 'moderado' | 'experto'
  lightRequired: 'baja' | 'media' | 'alta'
  petSafe: boolean
  size: 'pequena' | 'mediana' | 'grande'
  images: {
    card: ProductImage
    gallery: ProductImage[]
  }
}

export type ProductImage = {
  src: string
  webp?: string
  jpg?: string
}

const shopImageModules = import.meta.glob('../assets/shop/optimized/**/*.{jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const shopAsset = (relativePath: string) => {
  const modulePath = `../assets/shop/optimized/${relativePath}`
  return shopImageModules[modulePath]
}

const imageFromAsset = (relativePath: string): ProductImage => {
  const withoutExtension = relativePath.replace(/\.[^.]+$/, '')
  const webp = shopAsset(`${withoutExtension}.webp`)
  const jpg = shopAsset(`${withoutExtension}.jpg`)
  const src = webp ?? jpg ?? ''

  return {
    src,
    webp,
    jpg,
  }
}

export const productsMock: ProductMock[] = [
  {
    id: 'p1',
    name: 'Monstera Deliciosa',
    price: '$42',
    category: 'tropical',
    careLevel: 'moderado',
    lightRequired: 'media',
    petSafe: false,
    size: 'grande',
    images: {
      card: imageFromAsset('monstera/monstera1.webp'),
      gallery: [
        imageFromAsset('monstera/monstera2.jpg'),
        imageFromAsset('monstera/monstera3.webp'),
      ],
    },
  },
  {
    id: 'p2',
    name: 'Aloe Vera',
    price: '$22',
    category: 'suculenta',
    careLevel: 'facil',
    lightRequired: 'alta',
    petSafe: false,
    size: 'mediana',
    images: {
      card: imageFromAsset('aloes/aloe1.jpg'),
      gallery: [imageFromAsset('aloes/aloe2.jpg'), imageFromAsset('aloes/aloe3.jpg')],
    },
  },
  {
    id: 'p3',
    name: 'Crassula Ovata',
    price: '$20',
    category: 'suculenta',
    careLevel: 'facil',
    lightRequired: 'alta',
    petSafe: true,
    size: 'mediana',
    images: {
      card: imageFromAsset('crassula/CrassulaOvata2.jpg'),
      gallery: [
        imageFromAsset('crassula/CrassulaOvata1.jpg'),
        imageFromAsset('crassula/CrassulaOvata3.jpg'),
      ],
    },
  },
  {
    id: 'p4',
    name: 'Curio Rowleyanus',
    price: '$26',
    category: 'trepadora',
    careLevel: 'moderado',
    lightRequired: 'media',
    petSafe: true,
    size: 'pequena',
    images: {
      card: imageFromAsset('curio/Curio rowleyanus3.webp'),
      gallery: [
        imageFromAsset('curio/Curio rowleyanus1.jpg'),
        imageFromAsset('curio/Curio rowleyanus2.jpg'),
        imageFromAsset('curio/Curio rowleyanus4.webp'),
      ],
    },
  },
  {
    id: 'p5',
    name: 'Echeveria Elegans',
    price: '$18',
    category: 'suculenta',
    careLevel: 'facil',
    lightRequired: 'alta',
    petSafe: true,
    size: 'pequena',
    images: {
      card: imageFromAsset('echeveria/echeveria2.webp'),
      gallery: [
        imageFromAsset('echeveria/echeveria1.jpg'),
        imageFromAsset('echeveria/echeveria3.webp'),
        imageFromAsset('echeveria/echeveria4.jpg'),
        imageFromAsset('echeveria/echeveria5.jpg'),
      ],
    },
  },
  {
    id: 'p6',
    name: 'Epipremnum Aureum',
    price: '$24',
    category: 'trepadora',
    careLevel: 'facil',
    lightRequired: 'baja',
    petSafe: true,
    size: 'mediana',
    images: {
      card: imageFromAsset('epipremnum/epipremnum1.webp'),
      gallery: [
        imageFromAsset('epipremnum/epipremnum2.webp'),
        imageFromAsset('epipremnum/epipremnum3.webp'),
      ],
    },
  },
  {
    id: 'p7',
    name: 'Haworthia Fasciata',
    price: '$19',
    category: 'suculenta',
    careLevel: 'facil',
    lightRequired: 'media',
    petSafe: true,
    size: 'pequena',
    images: {
      card: imageFromAsset('haworthia/haworthia1.webp'),
      gallery: [
        imageFromAsset('haworthia/haworthia2.webp'),
        imageFromAsset('haworthia/haworthia3.webp'),
        imageFromAsset('haworthia/haworthia4.jpg'),
      ],
    },
  },
  {
    id: 'p8',
    name: 'Kalanchoe Blossfeldiana',
    price: '$21',
    category: 'suculenta',
    careLevel: 'moderado',
    lightRequired: 'alta',
    petSafe: true,
    size: 'pequena',
    images: {
      card: imageFromAsset('kalanchoe/Kalanchoe blossfeldiana1.webp'),
      gallery: [
        imageFromAsset('kalanchoe/Kalanchoe blossfeldiana2.webp'),
        imageFromAsset('kalanchoe/Kalanchoe blossfeldiana3.jpg'),
      ],
    },
  },
  {
    id: 'p9',
    name: 'Lithops',
    price: '$17',
    category: 'cactus',
    careLevel: 'facil',
    lightRequired: 'alta',
    petSafe: true,
    size: 'pequena',
    images: {
      card: imageFromAsset('lithops/lithops3.webp'),
      gallery: [
        imageFromAsset('lithops/Lithops1.jpg'),
        imageFromAsset('lithops/Lithops2.jpg'),
        imageFromAsset('lithops/lithops4.webp'),
      ],
    },
  },
  {
    id: 'p10',
    name: 'Zamioculcas Zamiifolia',
    price: '$36',
    category: 'tropical',
    careLevel: 'facil',
    lightRequired: 'baja',
    petSafe: true,
    size: 'mediana',
    images: {
      card: imageFromAsset('zamioculas/Zamioculcas zamiifolia1.webp'),
      gallery: [
        imageFromAsset('zamioculas/Zamioculcas zamiifoli2.jpg'),
        imageFromAsset('zamioculas/Zamioculcas zamiifolia3.jpg'),
      ],
    },
  },
]
