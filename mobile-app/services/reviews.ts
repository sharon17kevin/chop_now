import { supabase } from '@/lib/supabase';

export const ReviewService = {
    async getVendorRatings(vendorId: string) {
        const { data, error } = await supabase
            .from('reviews')
            .select('rating')
            .eq('vendor_id', vendorId)
            .eq('is_published', true);

        if (error) throw error;
        return data || [];
    },

    async getVendorReviews(vendorId: string, options?: {
        rating?: number;
        limit?: number;
        offset?: number;
    }) {
        const limit = options?.limit || 20;
        const offset = options?.offset || 0;

        let query = supabase
            .from('reviews')
            .select(`
                *,
                profiles:user_id (
                    full_name,
                    profile_image
                )
            `, { count: 'exact' })
            .eq('vendor_id', vendorId)
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (options?.rating) {
            query = query.eq('rating', options.rating);
        }

        const { data, error, count } = await query;

        if (error) throw error;
        return { data: data || [], count: count || 0 };
    },

    async updateVendorRating(vendorId: string, averageRating: number) {
        const { error } = await supabase
            .from('profiles')
            .update({ rating: averageRating })
            .eq('id', vendorId);

        if (error) throw error;
    },

    async getProductRatings(productId: string) {
        const { data, error } = await supabase
            .from('reviews')
            .select('rating')
            .eq('product_id', productId)
            .eq('is_published', true);

        if (error) throw error;
        return data || [];
    },

    async getProductReviews(productId: string, options?: {
        rating?: number;
        limit?: number;
        offset?: number;
    }) {
        const limit = options?.limit || 20;
        const offset = options?.offset || 0;

        let query = supabase
            .from('reviews')
            .select(`
                *,
                profiles:user_id (
                    full_name,
                    profile_image
                ),
                products:product_id (
                    name,
                    vendor_id
                )
            `, { count: 'exact' })
            .eq('product_id', productId)
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (options?.rating) {
            query = query.eq('rating', options.rating);
        }

        const { data, error, count } = await query;

        if (error) throw error;
        return { data: data || [], count: count || 0 };
    },

    async getProductRatingSummary(productId: string) {
        const { data, error } = await supabase
            .rpc('get_product_rating_summary', { p_product_id: productId });

        if (error) throw error;
        
        const summary = data?.[0] || {
            average_rating: 0,
            total_reviews: 0,
            rating_breakdown: {}
        };

        return {
            average: parseFloat(summary.average_rating) || 0,
            total: summary.total_reviews || 0,
            breakdown: summary.rating_breakdown || {}
        };
    },

    async createProductReview(data: {
        userId: string;
        productId: string;
        vendorId: string;
        rating: number;
        title?: string;
        comment: string;
        orderId?: string;
        images?: string[];
    }) {
        const { error } = await supabase
            .from('reviews')
            .insert({
                user_id: data.userId,
                product_id: data.productId,
                vendor_id: data.vendorId,
                rating: data.rating,
                title: data.title,
                comment: data.comment,
                order_id: data.orderId,
                images: data.images || [],
                verified_purchase: !!data.orderId
            });

        if (error) throw error;
    },

    async updateProductRating(productId: string, averageRating: number, reviewCount: number) {
        const { error } = await supabase
            .from('products')
            .update({ 
                rating: averageRating,
                review_count: reviewCount
            })
            .eq('id', productId);

        if (error) throw error;
    },

    async getReviewVote(reviewId: string, userId: string) {
        const { data, error } = await supabase
            .from('review_votes')
            .select('*')
            .eq('review_id', reviewId)
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async createReviewVote(reviewId: string, userId: string, isHelpful: boolean) {
        const { error } = await supabase
            .from('review_votes')
            .insert({
                review_id: reviewId,
                user_id: userId,
                is_helpful: isHelpful
            });

        if (error) throw error;
    },

    async updateReviewVote(voteId: string, isHelpful: boolean) {
        const { error } = await supabase
            .from('review_votes')
            .update({ is_helpful: isHelpful })
            .eq('id', voteId);

        if (error) throw error;
    },

    async checkExistingReview(userId: string, vendorId: string, orderId: string) {
        const { data, error } = await supabase
            .from('reviews')
            .select('id')
            .eq('user_id', userId)
            .eq('vendor_id', vendorId)
            .eq('order_id', orderId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async createReview(review: {
        user_id: string;
        vendor_id: string;
        order_id: string;
        rating: number;
        comment: string;
        title: string | null;
        images: string[];
        helpful_count: number;
        not_helpful_count: number;
        verified_purchase: boolean;
        vendor_response: string | null;
        vendor_response_at: string | null;
        is_published: boolean;
    }) {
        const { error } = await supabase.from('reviews').insert(review);
        if (error) throw error;
    }
};
