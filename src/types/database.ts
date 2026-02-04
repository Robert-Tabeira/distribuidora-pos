export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          order_position: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          order_position?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          order_position?: number
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          category_id: string | null
          name: string
          unit: string[]
          status: 'pending' | 'complete'
          location: string | null
          created_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          name: string
          unit?: string[]
          status?: 'pending' | 'complete'
          location?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          name?: string
          unit?: string[]
          status?: 'pending' | 'complete'
          location?: string | null
          created_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          name: string
          pin: string
          role: 'mostrador' | 'caja' | 'admin'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          pin: string
          role?: 'mostrador' | 'caja' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          pin?: string
          role?: 'mostrador' | 'caja' | 'admin'
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          customer_name: string
          employee_id: string | null
          status: 'draft' | 'sent' | 'completed'
          sent_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_name: string
          employee_id?: string | null
          status?: 'draft' | 'sent' | 'completed'
          sent_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_name?: string
          employee_id?: string | null
          status?: 'draft' | 'sent' | 'completed'
          sent_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          weight: number | null
          volume: number | null
          box_detail: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          weight?: number | null
          volume?: number | null
          box_detail?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          weight?: number | null
          volume?: number | null
          box_detail?: string | null
          notes?: string | null
          created_at?: string
        }
      }
    }
  }
}

export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Employee = Database['public']['Tables']['employees']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']

export type OrderWithItems = Order & {
  items: OrderItem[]
  employee?: Employee
}

export type CartItem = {
  product: Product
  selectedUnit: string
  quantity: number
  weight?: number
  volume?: number
  boxDetail?: string
  notes?: string
  checked?: boolean
}
