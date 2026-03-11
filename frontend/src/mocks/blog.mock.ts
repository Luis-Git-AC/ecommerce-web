export type BlogPostMock = {
  id: string
  title: string
  category: 'Cuidados' | 'Diseño' | 'Problemas comunes'
  excerpt: string
  date: string
  image: string
}

export const blogPostsMock: BlogPostMock[] = [
  {
    id: 'b1',
    title: 'Cómo regar suculentas sin pasarte',
    category: 'Cuidados',
    excerpt: 'Un método simple para saber cuándo regar y evitar hojas blandas o podridas.',
    date: '12 Feb 2026',
    image:
      'https://images.unsplash.com/photo-1459664018906-085c36f472af?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'b2',
    title: 'Luz natural: cómo medirla en casa',
    category: 'Cuidados',
    excerpt: 'Aprende a identificar si tu espacio tiene luz baja, media o alta sin instrumentos.',
    date: '05 Feb 2026',
    image:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'b3',
    title: 'Plantas que transforman un rincón pequeño',
    category: 'Diseño',
    excerpt: 'Ideas sencillas para sumar verde sin saturar el espacio.',
    date: '29 Jan 2026',
    image:
      'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'b4',
    title: 'Hojas amarillas: causas y soluciones rápidas',
    category: 'Problemas comunes',
    excerpt: 'Las razones más frecuentes y cómo corregirlas sin perder tu planta.',
    date: '22 Jan 2026',
    image:
      'https://images.unsplash.com/photo-1422568374078-27d3842ba676?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'b5',
    title: 'Guía básica para iniciar tu colección',
    category: 'Cuidados',
    excerpt: 'Las primeras plantas ideales para empezar con buen pie y poco riesgo.',
    date: '15 Jan 2026',
    image:
      'https://images.unsplash.com/photo-1446071103084-c257b5f70672?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'b6',
    title: 'Combina alturas y texturas en tu estantería',
    category: 'Diseño',
    excerpt: 'Un esquema simple para mezclar plantas y crear profundidad visual.',
    date: '08 Jan 2026',
    image:
      'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=900&q=80',
  },
]
