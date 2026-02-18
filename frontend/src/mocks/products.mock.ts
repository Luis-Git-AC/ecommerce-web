export type ProductMock = {
  id: string
  name: string
  price: string
  category: 'suculenta' | 'tropical' | 'cactus' | 'trepadora'
  careLevel: 'facil' | 'moderado' | 'experto'
  lightRequired: 'baja' | 'media' | 'alta'
  petSafe: boolean
  size: 'pequena' | 'mediana' | 'grande'
  image: string
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
    image:
      'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p2',
    name: 'Ficus Lyrata',
    price: '$58',
    category: 'tropical',
    careLevel: 'moderado',
    lightRequired: 'alta',
    petSafe: false,
    size: 'grande',
    image:
      'https://images.unsplash.com/photo-1483794344563-d27a8d18014e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p3',
    name: 'Pothos Dorado',
    price: '$24',
    category: 'trepadora',
    careLevel: 'facil',
    lightRequired: 'baja',
    petSafe: true,
    size: 'mediana',
    image:
      'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p4',
    name: 'Sansevieria',
    price: '$29',
    category: 'suculenta',
    careLevel: 'facil',
    lightRequired: 'baja',
    petSafe: false,
    size: 'mediana',
    image:
      'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p5',
    name: 'Calathea Orbifolia',
    price: '$46',
    category: 'tropical',
    careLevel: 'experto',
    lightRequired: 'media',
    petSafe: true,
    size: 'grande',
    image:
      'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p6',
    name: 'Zamioculca',
    price: '$36',
    category: 'tropical',
    careLevel: 'facil',
    lightRequired: 'baja',
    petSafe: true,
    size: 'mediana',
    image:
      'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p7',
    name: 'Echeveria Elegans',
    price: '$18',
    category: 'suculenta',
    careLevel: 'facil',
    lightRequired: 'alta',
    petSafe: true,
    size: 'pequena',
    image:
      'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p8',
    name: 'Aloe Vera',
    price: '$22',
    category: 'suculenta',
    careLevel: 'facil',
    lightRequired: 'alta',
    petSafe: false,
    size: 'mediana',
    image:
      'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p9',
    name: 'Cactus Perla',
    price: '$20',
    category: 'cactus',
    careLevel: 'facil',
    lightRequired: 'alta',
    petSafe: false,
    size: 'pequena',
    image:
      'https://images.unsplash.com/photo-1483794344563-d27a8d18014e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p10',
    name: 'Hoya Carnosa',
    price: '$34',
    category: 'trepadora',
    careLevel: 'moderado',
    lightRequired: 'media',
    petSafe: true,
    size: 'mediana',
    image:
      'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=800&q=80',
  },
]
