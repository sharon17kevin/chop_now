import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface ProductSkeletonProps {
  variant?: 'card' | 'carousel' | 'list';
}

export function ProductSkeleton({ variant = 'card' }: ProductSkeletonProps) {
  const { colors } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  if (variant === 'carousel') {
    return (
      <View style={[styles.carouselSkeleton, { backgroundColor: colors.card }]}>
        <Animated.View
          style={[
            styles.carouselImage,
            { backgroundColor: colors.filter, opacity },
          ]}
        />
        <View style={styles.carouselContent}>
          <Animated.View
            style={[
              styles.skeletonTitle,
              { backgroundColor: colors.filter, opacity },
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonSubtitle,
              { backgroundColor: colors.filter, opacity },
            ]}
          />
        </View>
      </View>
    );
  }

  if (variant === 'list') {
    return (
      <View style={[styles.listSkeleton, { backgroundColor: colors.card }]}>
        <Animated.View
          style={[
            styles.listImage,
            { backgroundColor: colors.filter, opacity },
          ]}
        />
        <View style={styles.listContent}>
          <Animated.View
            style={[
              styles.skeletonTitle,
              { backgroundColor: colors.filter, opacity },
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonSubtitle,
              { backgroundColor: colors.filter, opacity },
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonPrice,
              { backgroundColor: colors.filter, opacity },
            ]}
          />
        </View>
      </View>
    );
  }

  // Default card variant
  return (
    <View style={[styles.cardSkeleton, { backgroundColor: colors.card }]}>
      <Animated.View
        style={[styles.cardImage, { backgroundColor: colors.filter, opacity }]}
      />
      <View style={styles.cardContent}>
        <Animated.View
          style={[
            styles.skeletonTitle,
            { backgroundColor: colors.filter, opacity },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonSubtitle,
            { backgroundColor: colors.filter, opacity },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonPrice,
            { backgroundColor: colors.filter, opacity },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonButton,
            { backgroundColor: colors.filter, opacity },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Carousel skeleton
  carouselSkeleton: {
    width: 280,
    height: 220,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 10,
  },
  carouselImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: 12,
  },
  carouselContent: {
    gap: 8,
  },

  // List skeleton
  listSkeleton: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  listImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 16,
  },
  listContent: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // Card skeleton
  cardSkeleton: {
    width: 200,
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardContent: {
    padding: 16,
    gap: 8,
  },

  // Common skeleton elements
  skeletonTitle: {
    height: 16,
    borderRadius: 4,
    width: '70%',
  },
  skeletonSubtitle: {
    height: 14,
    borderRadius: 4,
    width: '50%',
  },
  skeletonPrice: {
    height: 18,
    borderRadius: 4,
    width: '40%',
  },
  skeletonButton: {
    height: 36,
    borderRadius: 6,
    width: '100%',
    marginTop: 4,
  },
});
