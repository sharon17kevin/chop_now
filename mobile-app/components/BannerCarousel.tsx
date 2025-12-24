import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { useTheme } from '@/hooks/useTheme';
import { useBanners, Banner } from '@/hooks/useBanners';
import { useRouter } from 'expo-router';
import { CategoryFilter } from '@/stores/useProductStore';

interface BannerCarouselProps {
  onCategorySelect?: (category: CategoryFilter) => void;
}

export default function BannerCarousel({
  onCategorySelect,
}: BannerCarouselProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { banners, isLoading, incrementImpressions, incrementClicks } =
    useBanners();
  const width = Dimensions.get('window').width;

  // Track impressions when banners load
  useEffect(() => {
    if (banners.length > 0) {
      banners.forEach((banner) => {
        incrementImpressions(banner.id);
      });
    }
  }, [banners]);

  const handleBannerPress = (banner: Banner) => {
    // Track click
    incrementClicks(banner.id);

    // Navigate based on action type
    switch (banner.action_type) {
      case 'product':
        if (banner.action_id) {
          router.push({
            pathname: '/(tabs)/(home)/items/[iteminfo]',
            params: { iteminfo: banner.action_id },
          });
        }
        break;

      case 'vendor':
        if (banner.action_id) {
          router.push({
            pathname: '/(tabs)/(home)/vendor/[vendorId]',
            params: {
              vendorId: banner.action_id,
              vendorName: banner.action_data?.vendorName || banner.title,
            },
          });
        }
        break;

      case 'category':
        if (banner.action_data?.category && onCategorySelect) {
          onCategorySelect(banner.action_data.category as CategoryFilter);
        }
        break;

      case 'url':
        if (banner.action_url) {
          Linking.openURL(banner.action_url);
        }
        break;
    }
  };

  // Show placeholder if no banners
  if (isLoading || banners.length === 0) {
    return (
      <View style={[styles.placeholder, { backgroundColor: colors.card }]}>
        <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
          {isLoading ? 'Loading...' : 'No promotions available'}
        </Text>
      </View>
    );
  }

  // Single banner - no carousel needed
  if (banners.length === 1) {
    const banner = banners[0];
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handleBannerPress(banner)}
        style={styles.container}
      >
        <View
          style={[
            styles.bannerCard,
            {
              backgroundColor: colors.card,
              shadowColor: colors.text,
            },
          ]}
        >
          <View style={styles.contentContainer}>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: colors.text }]}>
                {banner.title}
              </Text>
              {banner.subtitle && (
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  {banner.subtitle}
                </Text>
              )}
            </View>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: banner.image_url }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Multiple banners - use carousel
  return (
    <View style={styles.container}>
      <Carousel
        loop
        autoPlay
        autoPlayInterval={5000}
        width={width - 40} // Account for padding
        height={200}
        data={banners}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleBannerPress(item)}
          >
            <View
              style={[
                styles.bannerCard,
                {
                  backgroundColor: colors.card,
                  shadowColor: colors.text,
                },
              ]}
            >
              <View style={styles.contentContainer}>
                <View style={styles.textContainer}>
                  <Text style={[styles.title, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  {item.subtitle && (
                    <Text
                      style={[styles.subtitle, { color: colors.textSecondary }]}
                    >
                      {item.subtitle}
                    </Text>
                  )}
                </View>
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        onConfigurePanGesture={(g) =>
          g.activeOffsetX([-10, 10]).failOffsetY([-10, 10])
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 24,
  },
  placeholder: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  placeholderText: {
    fontSize: 16,
  },
  bannerCard: {
    width: '100%',
    borderRadius: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  contentContainer: {
    flexDirection: 'row',
    height: 200,
  },
  textContainer: {
    flex: 4,
    paddingHorizontal: 16,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  imageContainer: {
    flex: 7,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
