import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import ReviewCard from '@/components/ReviewCard';
import { useVendorReviews } from '@/hooks/useVendorReviews';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function ReviewsScreen() {
  const { colors } = useTheme();
  const { vendorId, vendorName } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();

  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const tabs = [
    { label: 'All', value: null },
    { label: '5★', value: 5 },
    { label: '4★', value: 4 },
    { label: '3★', value: 3 },
    { label: '2★', value: 2 },
    { label: '1★', value: 1 },
  ];

  // Fetch reviews with optional rating filter
  const { reviews, loading, error, hasMore, totalCount, refetch } =
    useVendorReviews(vendorId as string, {
      rating: selectedRating || undefined,
    });

  const handleTabPress = (value: number | null) => {
    setSelectedRating(value);
  };

  const handleHelpful = async (reviewId: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to vote on reviews.');
      return;
    }

    try {
      // Check if user has already voted
      const { data: existingVote } = await supabase
        .from('review_votes')
        .select('*')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        // Toggle vote
        await supabase
          .from('review_votes')
          .update({ is_helpful: !existingVote.is_helpful })
          .eq('id', existingVote.id);
      } else {
        // Create new vote
        await supabase.from('review_votes').insert({
          review_id: reviewId,
          user_id: user.id,
          is_helpful: true,
        });
      }

      // Refresh reviews to show updated counts
      refetch();
    } catch (err: any) {
      console.error('Error voting on review:', err);
      Alert.alert('Error', 'Failed to submit vote. Please try again.');
    }
  };

  const displayName = vendorName
    ? vendorName
        .toString()
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase())
    : 'Vendor';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Reviews
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.label}
              style={[
                styles.tab,
                {
                  backgroundColor:
                    selectedRating === tab.value ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => handleTabPress(tab.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      selectedRating === tab.value
                        ? colors.buttonText
                        : colors.text,
                    fontWeight: selectedRating === tab.value ? '600' : '500',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Reviews List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.text }]}>
            {selectedRating ? `${selectedRating}-Star Reviews` : `All Reviews`}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {totalCount} {totalCount === 1 ? 'review' : 'reviews'}
          </Text>
        </View>

        {loading && reviews.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={[
                styles.centerText,
                { color: colors.textSecondary, marginTop: 12 },
              ]}
            >
              Loading reviews...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.centerText, { color: colors.error }]}>
              Error loading reviews
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={refetch}
            >
              <Text
                style={[styles.retryButtonText, { color: colors.buttonText }]}
              >
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        ) : reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Star size={48} color={colors.textSecondary} />
            <Text
              style={[
                styles.emptyText,
                { color: colors.textSecondary, marginTop: 16 },
              ]}
            >
              {selectedRating
                ? `No ${selectedRating}-star reviews yet.`
                : 'No reviews yet. Be the first to leave a review!'}
            </Text>
          </View>
        ) : (
          <>
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onHelpful={handleHelpful}
              />
            ))}

            {hasMore && (
              <TouchableOpacity
                style={[styles.loadMoreButton, { borderColor: colors.border }]}
                onPress={() => {
                  // Load more functionality would need offset management
                  // For now, just show a message
                  Alert.alert('Load More', 'Pagination coming soon!');
                }}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text
                    style={[styles.loadMoreText, { color: colors.primary }]}
                  >
                    Load More Reviews
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  tabsContainer: {
    paddingBottom: 12,
  },
  tabsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  centerText: {
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadMoreButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
