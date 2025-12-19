import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Dimensions,
} from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  MapPin,
  Star,
  Phone,
  Clock,
  Package,
  CheckCircle,
  XCircle,
  Award,
  TrendingUp,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import AppHeader from '@/components/AppHeader';
import { useVendorRating } from '@/hooks/useVendorRating';
import { useVendorProfile } from '@/hooks/useVendorProfile';
import { typography } from '@/styles/typography';

const { width } = Dimensions.get('window');
const BANNER_HEIGHT = 200;
const PROFILE_SIZE = 100;

export default function VendorInfo() {
  const { colors } = useTheme();
  const { vendorId, vendorName, vendorAddress, vendorRating } =
    useLocalSearchParams();

  const router = useRouter();

  // Fetch vendor profile from hook
  const {
    profile: vendorProfile,
    loading,
    error,
    formatBusinessHours,
  } = useVendorProfile(vendorId as string);

  // Fetch rating data from hook
  const { rating: ratingData } = useVendorRating(vendorId as string);

  if (loading) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <AppHeader title="Vendor Information" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading vendor information...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !vendorProfile) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <AppHeader title="Vendor Information" />
        <View style={styles.errorContainer}>
          <XCircle size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error || 'Vendor not found'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Use vendor's actual images or show placeholders
  const bannerImage = vendorProfile.banner_image || null;
  const profileImage = vendorProfile.profile_image || null;

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Vendor Information" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Image */}
        {bannerImage ? (
          <View style={styles.bannerContainer}>
            <Image
              source={{ uri: bannerImage }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            {/* Overlay gradient */}
            <View style={styles.bannerOverlay} />
          </View>
        ) : (
          <View
            style={[
              styles.bannerContainer,
              styles.bannerPlaceholder,
              { backgroundColor: colors.filter },
            ]}
          />
        )}

        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* Profile Image */}
          <View
            style={[
              styles.profileImageContainer,
              { borderColor: colors.background },
            ]}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.profileImage,
                  styles.profilePlaceholder,
                  { backgroundColor: colors.filter },
                ]}
              >
                <Text
                  style={[
                    styles.profilePlaceholderText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {(vendorProfile.farm_name || vendorProfile.full_name || 'V')
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>
            )}
            {vendorProfile.verified && (
              <View
                style={[
                  styles.verifiedBadgeSmall,
                  { backgroundColor: colors.success },
                ]}
              >
                <CheckCircle size={20} color="white" />
              </View>
            )}
          </View>

          {/* Vendor Info */}
          <View style={styles.vendorInfoSection}>
            <Text style={[styles.vendorTitle, { color: colors.text }]}>
              {vendorProfile.farm_name || vendorProfile.full_name || vendorName}
            </Text>

            {vendorProfile.verified && (
              <View style={styles.verifiedBadge}>
                <CheckCircle size={16} color={colors.success} />
                <Text style={[styles.verifiedText, { color: colors.success }]}>
                  Verified Vendor
                </Text>
              </View>
            )}

            {vendorProfile.farm_description && (
              <Text
                style={[styles.description, { color: colors.textSecondary }]}
                numberOfLines={3}
              >
                {vendorProfile.farm_description}
              </Text>
            )}

            {/* Quick Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Award size={16} color={colors.secondary} />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {vendorProfile.total_orders || 0}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Orders
                </Text>
              </View>

              <View
                style={[styles.statDivider, { backgroundColor: colors.border }]}
              />

              <View style={styles.statItem}>
                <TrendingUp size={16} color={colors.secondary} />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {vendorProfile.favorite_count || 0}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Favorites
                </Text>
              </View>

              <View
                style={[styles.statDivider, { backgroundColor: colors.border }]}
              />

              <View style={styles.statItem}>
                <Star size={16} color={colors.secondary} />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {ratingData?.average
                    ? ratingData.average.toFixed(1)
                    : vendorProfile.rating
                    ? vendorProfile.rating.toFixed(1)
                    : '0.0'}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Rating
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Rating Section */}
        {ratingData && (
          <View
            style={[
              styles.ratingCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Customer Reviews
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
                <Text
                  style={[styles.ratingCount, { color: colors.textSecondary }]}
                >
                  Based on {ratingData.total} reviews
                </Text>
              </View>

              {/* Right: Breakdown */}
              <View style={styles.ratingBreakdown}>
                {['5', '4', '3', '2', '1'].map((star) => {
                  const sumCount = Object.values(ratingData.breakdown).reduce(
                    (a, b) => a + b,
                    0
                  );
                  const percentage =
                    sumCount > 0
                      ? (ratingData.breakdown[star] / sumCount) * 100
                      : 0;
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
                          { backgroundColor: colors.border },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${percentage}%`,
                              backgroundColor: colors.secondary,
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
                  pathname: '/reviews',
                  params: { vendorId },
                })
              }
            >
              <Text style={[styles.viewAllText, { color: colors.secondary }]}>
                View All Reviews
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Old Vendor Header - DELETE THIS */}
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              display: 'none',
            },
          ]}
        >
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.vendorTitle, { color: colors.text }]}>
                {vendorProfile.farm_name ||
                  vendorProfile.full_name ||
                  vendorName}
              </Text>
              {vendorProfile.verified && (
                <View style={styles.verifiedBadge}>
                  <CheckCircle size={16} color={colors.success} />
                  <Text
                    style={[styles.verifiedText, { color: colors.success }]}
                  >
                    Verified Vendor
                  </Text>
                </View>
              )}
            </View>

            {vendorRating && ratingData && (
              <View style={styles.ratingSection}>
                {/* Left: Average */}
                <View style={styles.ratingAverage}>
                  <Text style={[typography.h1, { color: colors.text }]}>
                    {ratingData.average.toFixed(1)}
                  </Text>
                  <View style={{ flexDirection: 'row' }}>
                    {[5, 4, 3, 2, 1].map((star: number) => (
                      <Star
                        size={20}
                        key={star}
                        fill={
                          star <= Math.round(ratingData.average)
                            ? colors.secondary
                            : 'transparent'
                        }
                        color={colors.secondary}
                        style={{ marginLeft: 2, marginBottom: 5 }}
                      />
                    ))}
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: '/vendor/reviews',
                        params: { vendorId },
                      })
                    }
                  >
                    <Text
                      style={[
                        typography.body2,
                        { color: colors.textSecondary, marginTop: 4 },
                      ]}
                    >
                      {ratingData.total} ratings
                    </Text>
                  </TouchableOpacity>
                </View>
                {/* Right: Breakdown */}
                <View style={styles.ratingBreakdown}>
                  {['5', '4', '3', '2', '1'].map((star: string) => {
                    const sumCount = Object.values(ratingData.breakdown).reduce(
                      (a, b) => a + b,
                      0
                    );
                    const percentage =
                      sumCount > 0
                        ? (ratingData.breakdown[star] / sumCount) * 100
                        : 0;

                    return (
                      <View key={star} style={styles.ratingRow}>
                        <Text
                          style={[
                            typography.body2,
                            { color: colors.textSecondary, width: 16 },
                          ]}
                        >
                          {star}
                        </Text>

                        <View
                          style={[
                            styles.progressBarBackground,
                            { backgroundColor: colors.textSecondary },
                          ]}
                        >
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${percentage}%`,
                                backgroundColor: colors.secondary,
                              },
                            ]}
                          />
                        </View>
                        <Text
                          style={[
                            typography.body2,
                            {
                              color: colors.textSecondary,
                              width: 36,
                              textAlign: 'right',
                            },
                          ]}
                        >
                          {`${Math.round(percentage)}%`}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {vendorProfile.farm_description && (
            <Text
              style={[
                styles.description,
                { color: colors.textSecondary, marginTop: 12 },
              ]}
            >
              {vendorProfile.farm_description}
            </Text>
          )}
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Contact Information
          </Text>

          {vendorProfile.business_phone && (
            <View
              style={[
                styles.infoRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Phone size={20} color={colors.secondary} />
              <View style={styles.infoContent}>
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  Phone
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {vendorProfile.business_phone}
                </Text>
              </View>
            </View>
          )}

          {(vendorProfile.address || vendorAddress) && (
            <View
              style={[
                styles.infoRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <MapPin size={20} color={colors.secondary} />
              <View style={styles.infoContent}>
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  Address
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {vendorProfile.address || vendorAddress}
                </Text>
                {vendorProfile.city && vendorProfile.state && (
                  <Text
                    style={[styles.infoSubtext, { color: colors.textTetiary }]}
                  >
                    {vendorProfile.city}, {vendorProfile.state}
                  </Text>
                )}
              </View>
            </View>
          )}

          {vendorProfile.farm_location && (
            <View
              style={[
                styles.infoRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <MapPin size={20} color={colors.secondary} />
              <View style={styles.infoContent}>
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  Farm Location
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {vendorProfile.farm_location}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Business Hours */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Business Hours
          </Text>

          <View
            style={[
              styles.infoRow,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Clock size={20} color={colors.secondary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Operating Hours
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatBusinessHours(vendorProfile.business_hours)}
              </Text>
              <Text style={[styles.infoSubtext, { color: colors.textTetiary }]}>
                Monday - Saturday
              </Text>
            </View>
          </View>
        </View>

        {/* Delivery Zones */}
        {vendorProfile.delivery_zones &&
          vendorProfile.delivery_zones.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Delivery Zones
              </Text>

              <View
                style={[
                  styles.infoRow,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Package size={20} color={colors.secondary} />
                <View style={styles.infoContent}>
                  <Text
                    style={[styles.infoLabel, { color: colors.textSecondary }]}
                  >
                    Available Delivery Areas
                  </Text>
                  <View style={styles.zonesList}>
                    {vendorProfile.delivery_zones.map(
                      (zone: string, index: number) => (
                        <View
                          key={index}
                          style={[
                            styles.zoneTag,
                            { backgroundColor: colors.filter },
                          ]}
                        >
                          <Text
                            style={[
                              styles.zoneText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {zone}
                          </Text>
                        </View>
                      )
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}

        {/* Member Since */}
        <View
          style={[
            styles.footerCard,
            { backgroundColor: colors.filter, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Member since{' '}
            {new Date(vendorProfile.created_at).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
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
    padding: 40,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Banner styles
  bannerContainer: {
    width: width,
    height: BANNER_HEIGHT,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },

  // Profile section
  profileSection: {
    paddingHorizontal: 16,
    marginTop: -(PROFILE_SIZE / 2),
  },
  profileImageContainer: {
    width: PROFILE_SIZE,
    height: PROFILE_SIZE,
    borderRadius: PROFILE_SIZE / 2,
    borderWidth: 4,
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: PROFILE_SIZE / 2,
  },
  profilePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePlaceholderText: {
    fontSize: 40,
    fontWeight: '700',
  },
  verifiedBadgeSmall: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  vendorInfoSection: {
    gap: 8,
  },
  vendorTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
  },

  // Rating card
  ratingCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
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

  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  infoSubtext: {
    fontSize: 13,
    marginTop: 4,
  },
  zonesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  zoneTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  zoneText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Old styles - to be removed
  headerCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    gap: 24,
  },
});
