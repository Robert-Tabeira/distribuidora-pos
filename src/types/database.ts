export interface Category {
  id: string
  name: string
  order_position: number
  created_at: string
}

export interface Product {
  id: string
  name: string
  unit: string[]
  category_id: string | null
  location: string | null
  status: 'pending' | 'complete'
  created_at: string
  price_lista1_kg: number | null
  price_lista1_unidad: number | null
  price_lista1_caja: number | null
  price_lista1_funda: number | null
  price_lista1_litro: number | null
}

export interface Employee {
  id: string
  name: string
  pin: string
  role: 'mostrador' | 'caja' | 'admin'
  created_at: string
}

export interface Order {
  id: string
  customer_name: string
  employee_id: string
  status: 'draft' | 'sent' | 'completed'
  created_at: string
  sent_at: string | null
  completed_at: string | null
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  weight: number | null
  volume: number | null
  box_detail: string | null
  notes: string | null
}

export interface CartItem {
  product: Product
  selectedUnit?: string
  quantity: number
  weight?: number
  volume?: number
  boxDetail?: string
  notes?: string
}