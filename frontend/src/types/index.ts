export interface User {
  id: number
  full_name: string
  email: string
  phone?: string
  role: 'admin' | 'staff' | 'customer'
  loyalty_tier?: string
  department?: string
  permissions_scope?: string
  is_active: boolean
}

export interface Product {
  id: number
  name: string
  category: string
  price: string
  ai_match?: number
  image_icon?: string
}

export interface CartItem {
  id: number
  name: string
  price: number
  icon?: string
  qty: number
}

export interface Order {
  id: number
  order_number: string
  customer_name: string
  customer_email: string
  status: string
  payment_status: string
  shipping_status: string
  total_amount: string
  created_at: string
}

export interface Payment {
  id: number
  transaction_ref: string
  order_number: string
  customer_name: string
  amount: string
  method: string
  status: string
}

export interface Shipment {
  id: number
  tracking_number: string
  order_number: string
  carrier: string
  destination: string
  eta_days: number
  shipping_status: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'bot'
  text: string
  products?: Product[]
  sources?: string[]
}
