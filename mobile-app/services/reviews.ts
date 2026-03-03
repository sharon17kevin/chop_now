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

    async updateReviewVote(voteId: string, isHelpful: boolean) {
        const { error } = await supabase
            .from('review_votes')
            .update({ is_helpful: isHelpful })
            .eq('id', voteId);

        if (error) throw error;
    },

    async createReviewVote(reviewId: string, userId: string, isHelpful: boolean) {
        const { error } = await supabase
            .from('review_votes')
            .insert({
                review_id: reviewId,
                user_id: userId,
                is_helpful: isHelpful,
            });

        if (error) throw error;
    },
};
