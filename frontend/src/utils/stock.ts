export const LOW_STOCK_THRESHOLD = 5

export type StockStatus = 'out' | 'low' | 'available'

export const getStockStatus = (stock: number): StockStatus => {
  if (stock <= 0) {
    return 'out'
  }

  return stock <= LOW_STOCK_THRESHOLD ? 'low' : 'available'
}

export const getStockLabel = (stock: number): string | null => {
  const status = getStockStatus(stock)

  if (status === 'out') {
    return 'Agotado'
  }

  if (status === 'low') {
    return stock === 1 ? 'Última unidad' : `Últimas ${stock} unidades`
  }

  return null
}
