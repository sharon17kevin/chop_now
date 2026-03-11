import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import ReviewCard from '@/components/ReviewCard';
import { useProductReviews, useProductRating } from '@/hooks/useProductRating';

export default function ProductReviewsScreen() {
  const { colors } = useTheme();
  const { productId, productName } = useLocalSearchParams();
  const router = useRouter();

  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  // Fetch product rating summary
  const { data: ratingData } = useProductRating(productId as string);

  // Fetch product reviews with optional rating filter
  const {
    data: reviewsData,
    isLoading,
    error,
  } = useProductReviews(productId as string, {
    rating: selectedRating || undefined,
  });

  const tabs = [
    { label: 'All', value: null },
    { label: '5★', value: 5 },
    { label: '4★', value: 4 },
    { label: '3★', value: 3 },
    { label: '2★', value: 2 },
    { label: '1★', value: 1 },
  ];

  const handleTabPress = (value: number | null) => {
    setSelectedRating(value);
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.filter }]}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Product Reviews
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            {productName}
          </Text>
        </View>
      </View>

      {/* Rating Summary */}
      {ratingData && ratingData.total > 0 && (
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <View style={styles.summaryContent}>
            <Text style={[styles.averageRating, { color: colors.text }]}>
              {ratingData.average.toFixed(1)}
            </Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  size={16}
                  key={star}
                  fill={
                    star <= Math.round(ratingData.average)
                      ? colors.secondary
                      : 'transparent'
                  }
                  color={colors.secondary}
                />
              ))}
            </View>
            <Text
              style={[styles.totalReviews, { color: colors.textSecondary }]}
            >
              {ratingData.total} {ratingData.total === 1 ? 'review' : 'reviews'}
            </Text>
          </View>
        </View>
      )}

      {/* Rating Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsContainer, { backgroundColor: colors.card }]}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => {
          const isActive = selectedRating === tab.value;
          const count = tab.value
            ? ratingData?.breakdown[tab.value.toString()] || 0
            : ratingData?.total || 0;

          return (
            <TouchableOpacity
              key={tab.label}
              onPress={() => handleTabPress(tab.value)}
              style={[
                styles.tab,
                {
                  backgroundColor: isActive ? colors.primary : colors.filter,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isActive ? '#FFF' : colors.text,
                    fontWeight: isActive ? '700' : '600',
                  },
                ]}
              >
                {tab.label}
              </Text>
              {count > 0 && (
                <Text
                  style={[
                    styles.tabCount,
                    {
                      color: isActive ? '#FFF' : colors.textSecondary,
                    },
                  ]}
                >
                  ({count})
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Reviews List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading reviews...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Failed to load reviews
          </Text>
        </View>
      ) : !reviewsData || reviewsData.reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {selectedRating
              ? `No ${selectedRating}-star reviews found`
              : 'No reviews yet for this product'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={reviewsData.reviews}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReviewCard
              review={item}
              onHelpful={(reviewId) => {
                /* TODO: Implement helpful vote */
                console.log('Helpful vote for review:', reviewId);
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryCard: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  summaryContent: {
    alignItems: 'center',
  },
  averageRating: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabsContainer: {
    maxHeight: 60,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tabText: {
    fontSize: 14,
  },
  tabCount: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  listContent: {
    padding: 16,
  },
});
