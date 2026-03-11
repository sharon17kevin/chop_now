import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useProductRating } from '@/hooks/useProductRating';
import { useRouter } from 'expo-router';

interface ProductRatingSectionProps {
  productId: string;
  productName: string;
  vendorId?: string;
}

export default function ProductRatingSection({
  productId,
  productName,
  vendorId,
}: ProductRatingSectionProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { data: ratingData, isLoading } = useProductRating(productId);

  if (isLoading) {
    return (
      <View
        style={[
          styles.ratingCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Product Reviews
        </Text>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading reviews...
        </Text>
      </View>
    );
  }

  if (!ratingData || ratingData.total === 0) {
    return (
      <View
        style={[
          styles.ratingCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Product Reviews
        </Text>
        <Text style={[styles.noReviewsText, { color: colors.textSecondary }]}>
          No reviews yet. Be the first to review this product!
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.ratingCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Product Reviews
      </Text>

      <View style={styles.ratingContent}>
        {/* Left: Average */}
        <View style={styles.ratingAverage}>
          <Text style={[styles.ratingNumber, { color: colors.text }]}>
            {ratingData.average.toFixed(1)}
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                size={18}
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
          <Text style={[styles.ratingCount, { color: colors.textSecondary }]}>
            Based on {ratingData.total}{' '}
            {ratingData.total === 1 ? 'review' : 'reviews'}
          </Text>
        </View>

        {/* Right: Breakdown */}
        <View style={styles.ratingBreakdown}>
          {['5', '4', '3', '2', '1'].map((star) => {
            const sumCount = Object.values(ratingData.breakdown).reduce(
              (a, b) => a + b,
              0,
            );
            const percentage =
              sumCount > 0 ? (ratingData.breakdown[star] / sumCount) * 100 : 0;
            const count = ratingData.breakdown[star] || 0;

            return (
              <View key={star} style={styles.ratingRow}>
                <Text
                  style={[
                    styles.ratingRowLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  {star}
                </Text>
                <Star
                  size={14}
                  color={colors.secondary}
                  fill={colors.secondary}
                />

                <View
                  style={[
                    styles.progressBarBackground,
                    { backgroundColor: colors.filter },
                  ]}
                >
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: colors.secondary,
                        width: `${percentage}%`,
                      },
                    ]}
                  />
                </View>

                <Text
                  style={[
                    styles.ratingRowCount,
                    { color: colors.textSecondary },
                  ]}
                >
                  {count}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.viewAllButton, { borderColor: colors.border }]}
        onPress={() =>
          router.push({
            pathname: '/(home)/product-reviews' as any,
            params: {
              productId,
              productName,
              vendorId,
            },
          })
        }
      >
        <Text style={[styles.viewAllText, { color: colors.secondary }]}>
          View All Reviews
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  ratingCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  noReviewsText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  ratingContent: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
  },
  ratingAverage: {
    alignItems: 'center',
    minWidth: 90,
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 52,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 8,
  },
  ratingCount: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  ratingBreakdown: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingRowLabel: {
    fontSize: 13,
    fontWeight: '600',
    width: 12,
  },
  progressBarBackground: {
    height: 8,
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  ratingRowCount: {
    fontSize: 12,
    fontWeight: '500',
    width: 32,
    textAlign: 'right',
  },
  viewAllButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
