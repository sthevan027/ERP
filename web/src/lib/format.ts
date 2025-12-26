import type { ProductStatus } from './types'

export function statusLabel(s: ProductStatus): string {
  switch (s) {
    case 'in_transit':
      return 'A caminho'
    case 'received':
      return 'Recebido'
    case 'in_stock':
      return 'Em estoque'
  }
}

export function statusBadgeClass(s: ProductStatus): 'primary' | 'warn' | 'ok' {
  switch (s) {
    case 'in_transit':
      return 'warn'
    case 'received':
      return 'primary'
    case 'in_stock':
      return 'ok'
  }
}


