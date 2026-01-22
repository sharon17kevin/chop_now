import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star, MessageSquare } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/styles/typography';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/useUserStore';

export default function WriteReviewScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const profile = useUserStore((state) => state.profile);

  const orderId = params.orderId as string;
  const vendorId = params.vendorId as string;
  const vendorName = params.vendorName as string;
  const orderStatus = params.orderStatus as string;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleStarPress = (star: number) => {
    setRating(star);
  };

  const handleSubmit = async () => {
    if (!profile?.id) {
      Alert.alert('Error', 'Please log in to submit a review.');
      return;
    }

    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating.');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Review Required', 'Please write a review.');
      return;
    }

    try {
      setSubmitting(true);

      // Check if user already reviewed this vendor for this order
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', profile.id)
        .eq('vendor_id', vendorId)
        .eq('order_id', orderId)
        .single();

      if (existingReview) {
        Alert.alert(
          'Already Reviewed',
          'You have already submitted a review for this order.',
        );
        setSubmitting(false);
        return;
      }

      // Insert review
      const { error: insertError } = await supabase.from('reviews').insert({
        user_id: profile.id,
        vendor_id: vendorId,
        order_id: orderId,
        rating: rating,
        comment: comment.trim(),
        title: null,
        images: [],
        helpful_count: 0,
        not_helpful_count: 0,
        verified_purchase: true, // Since it's from an order
        vendor_response: null,
        vendor_response_at: null,
        is_published: true, // Auto-publish or set to false for moderation
      });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      Alert.alert(
        'Success',
        'Thank you for your review!',
        [
          {
            text: 'View Reviews',
            onPress: () => {
              router.replace({
                pathname: '/(tabs)/(home)/reviews',
                params: {
                  vendorId: vendorId,
                  vendorName: vendorName,
                },
              });
            },
          },
          {
            text: 'Done',
            onPress: () => {
              router.back();
            },
          },
        ],
        { cancelable: false },
      );
    } catch (err: any) {
      console.error('Error submitting review:', err);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = () => {
    switch (rating) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return 'Tap to rate';
    }
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
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Write a Review
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Vendor Info */}
          <View
            style={[
              styles.vendorSection,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                typography.body2,
                { color: colors.textSecondary, marginBottom: 4 },
              ]}
            >
              Reviewing
            </Text>
            <Text style={[typography.h3, { color: colors.text }]}>
              {vendorName}
            </Text>
            <Text
              style={[
                typography.caption1,
                { color: colors.textSecondary, marginTop: 8 },
              ]}
            >
              Order #{orderId?.slice(0, 8).toUpperCase()}
            </Text>
          </View>

          {/* Rating Section */}
          <View
            style={[
              styles.ratingSection,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                typography.body1,
                { color: colors.text, fontWeight: '700', marginBottom: 8 },
              ]}
            >
              How would you rate your experience?
            </Text>
            <Text
              style={[
                typography.body2,
                { color: colors.textSecondary, marginBottom: 20 },
              ]}
            >
              Tap a star to rate
            </Text>

            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleStarPress(star)}
                  style={styles.starButton}
                  activeOpacity={0.7}
                >
                  <Star
                    size={40}
                    color={star <= rating ? '#FDB022' : colors.border}
                    fill={star <= rating ? '#FDB022' : 'transparent'}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text
              style={[
                typography.body1,
                {
                  color: rating > 0 ? colors.primary : colors.textSecondary,
                  fontWeight: '700',
                  marginTop: 16,
                  textAlign: 'center',
                },
              ]}
            >
              {getRatingLabel()}
            </Text>
          </View>

          {/* Comment Section */}
          <View
            style={[
              styles.commentSection,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <MessageSquare size={20} color={colors.text} />
              <Text
                style={[
                  typography.body1,
                  { color: colors.text, fontWeight: '700', marginLeft: 8 },
                ]}
              >
                Share your experience
              </Text>
            </View>

            <TextInput
              style={[
                styles.commentInput,
                {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Tell us about your experience with this vendor..."
              placeholderTextColor={colors.textTetiary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
              maxLength={500}
            />

            <Text
              style={[
                typography.caption2,
                {
                  color: colors.textSecondary,
                  textAlign: 'right',
                  marginTop: 8,
                },
              ]}
            >
              {comment.length}/500
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: colors.secondary,
                opacity:
                  submitting || rating === 0 || !comment.trim() ? 0.5 : 1,
              },
            ]}
            onPress={handleSubmit}
            disabled={submitting || rating === 0 || !comment.trim()}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.buttonText} />
            ) : (
              <Text
                style={[
                  typography.body1,
                  { color: colors.buttonText, fontWeight: '700' },
                ]}
              >
                Submit Review
              </Text>
            )}
          </TouchableOpacity>

          {/* View Existing Reviews Link */}
          <TouchableOpacity
            style={styles.viewReviewsButton}
            onPress={() => {
              router.push({
                pathname: '/(tabs)/(home)/reviews',
                params: {
                  vendorId: vendorId,
                  vendorName: vendorName,
                },
              });
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                typography.body2,
                { color: colors.primary, fontWeight: '600' },
              ]}
            >
              View existing reviews for {vendorName}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  vendorSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  ratingSection: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  commentSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  commentInput: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  viewReviewsButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
});
