import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Star, ThumbsUp, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { Review } from '@/hooks/useVendorReviews';

interface ReviewCardProps {
  review: Review;
  onHelpful?: (reviewId: string) => void;
  showVendorResponse?: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onHelpful,
  showVendorResponse = true,
}) => {
  const { colors } = useTheme();

  // Safety check
  if (!review) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.reviewerInfo}>
          {review.reviewer_image ? (
            <Image
              source={{ uri: review.reviewer_image }}
              style={styles.avatar}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarPlaceholder,
                { backgroundColor: colors.filter },
              ]}
            >
              <Text
                style={[styles.avatarText, { color: colors.textSecondary }]}
              >
                {review.reviewer_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.reviewerDetails}>
            <View style={styles.nameRow}>
              <Text style={[styles.reviewerName, { color: colors.text }]}>
                {review.reviewer_name}
              </Text>
              {review.verified_purchase && (
                <View style={styles.verifiedBadge}>
                  <CheckCircle2 size={14} color={colors.success} />
                  <Text
                    style={[styles.verifiedText, { color: colors.success }]}
                  >
                    Verified
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.ratingRow}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  fill={i < review.rating ? colors.secondary : 'none'}
                  color={colors.secondary}
                  style={{ marginRight: 2 }}
                />
              ))}
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                • {formatDate(review.created_at)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Title */}
      {review.title && (
        <Text style={[styles.reviewTitle, { color: colors.text }]}>
          {review.title}
        </Text>
      )}

      {/* Comment */}
      <Text style={[styles.comment, { color: colors.textSecondary }]}>
        {review.comment}
      </Text>

      {/* Review Images */}
      {review.images && review.images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imagesContainer}
          contentContainerStyle={styles.imagesContent}
        >
          {review.images.map((imageUrl, index) => (
            <Image
              key={index}
              source={{ uri: imageUrl }}
              style={styles.reviewImage}
            />
          ))}
        </ScrollView>
      )}

      {/* Helpful Button */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={styles.helpfulButton}
          onPress={() => onHelpful?.(review.id)}
          activeOpacity={0.7}
        >
          <ThumbsUp size={16} color={colors.textSecondary} />
          <Text style={[styles.helpfulText, { color: colors.textSecondary }]}>
            Helpful ({review.helpful_count})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Vendor Response */}
      {showVendorResponse && review.vendor_response && (
        <View
          style={[
            styles.vendorResponse,
            {
              backgroundColor: colors.filter,
              borderColor: colors.success,
            },
          ]}
        >
          <Text style={[styles.vendorResponseTitle, { color: colors.text }]}>
            Response from Vendor
          </Text>
          <Text
            style={[styles.vendorResponseText, { color: colors.textSecondary }]}
          >
            {review.vendor_response}
          </Text>
          {review.vendor_response_at && (
            <Text style={[styles.responseDate, { color: colors.textTetiary }]}>
              {formatDate(review.vendor_response_at)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewerInfo: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewerDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    marginLeft: 6,
  },
  reviewTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
  },
  comment: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  imagesContainer: {
    marginTop: 12,
  },
  imagesContent: {
    gap: 8,
  },
  reviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  helpfulText: {
    fontSize: 13,
    fontWeight: '500',
  },
  vendorResponse: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  vendorResponseTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  vendorResponseText: {
    fontSize: 13,
    lineHeight: 18,
  },
  responseDate: {
    fontSize: 11,
    marginTop: 4,
  },
});

export default ReviewCard;
