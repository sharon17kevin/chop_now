import { supabase } from "@/lib/supabase"

export async function fetchProducts() {
  const { data, error } = await supabase.from('products').select('*')
  if (error) throw error
  return data
}

export async function addProduct(product) {
  const { data, error } = await supabase.from('products').insert([product])
  if (error) throw error
  return data
}