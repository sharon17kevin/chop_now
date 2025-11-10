import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchProducts, addProduct } from '../services/products'

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  })
}

export function useAddProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addProduct,
    onSuccess: () => queryClient.invalidateQueries(['products'])
  })
}
