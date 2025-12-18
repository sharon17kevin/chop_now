export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            products: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    price: number
                    original_price: number | null
                    image_url: string | null
                    category: string
                    stock: number
                    unit: string
                    discount_percentage: number | null
                    vendor_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    price: number
                    original_price?: number | null
                    image_url?: string | null
                    category: string
                    stock?: number
                    unit?: string
                    discount_percentage?: number | null
                    vendor_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    price?: number
                    original_price?: number | null
                    image_url?: string | null
                    category?: string
                    stock?: number
                    unit?: string
                    discount_percentage?: number | null
                    vendor_id?: string
                    created_at?: string
                }
            }
            cart_items: {
                Row: {
                    id: string
                    user_id: string
                    product_id: string
                    quantity: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    product_id: string
                    quantity?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    product_id?: string
                    quantity?: number
                    created_at?: string
                }
            }
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    avatar_url: string | null
                    role: 'user' | 'vendor' | 'driver' | 'admin'
                    created_at: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    role?: 'user' | 'vendor' | 'driver' | 'admin'
                    created_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    role?: 'user' | 'vendor' | 'driver' | 'admin'
                    created_at?: string
                }
            }
        }
        Views: {
            [_: string]: {
                Row: {
                    [key: string]: Json
                }
            }
        }
        Functions: {
            [_: string]: {
                Args: {
                    [key: string]: Json
                }
                Returns: Json
            }
        }
        Enums: {
            [_: string]: string
        }
    }
}
