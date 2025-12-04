export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock: number;
  unit: string;
  vendor_id: string;
  is_available: boolean;
  rating?: number;
  profiles?: {
    full_name: string;
  };
}