import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { board1, board2, board3 } from '@/assets/images';

import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import SliderButton from '@/components/SliderButton';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/styles/typography';

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  image: number;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Quick Ordering',
    subtitle: "Skip the line, Order ahead. we've got you covered!",
    image: board1,
  },
  {
    id: '2',
    title: 'Pay With Ease',
    subtitle: 'Smooth checkout, every time. Pay with ease on Chop n Cart.',
    image: board2,
  },
  {
    id: '3',
    title: 'Quick Delivery',
    subtitle:
      'Get your favorite food and food items delivered fast. Order now and enjoy your meal in minutes. ',
    image: board3,
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);
  const slideAnim = useSharedValue(0);
  const [isSliding, setIsSliding] = useState(false);
  const { width, height } = useWindowDimensions();

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      console.log('Get Started pressed');
      completeOnboarding().catch((e) =>
        console.error('completeOnboarding error', e)
      );
    }
  };

  const handleSkip = () => {
    //latListRef.current?.scrollToIndex({ index: slides.length - 1 });
    completeOnboarding().catch((e) =>
      console.error('completeOnboarding error', e)
    );
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          setIsSliding(true);
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dx > 0) {
            slideAnim.value = gestureState.dx;
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > 100) {
            slideAnim.value = withTiming(
              width - 80,
              {
                duration: 300,
              },
              () => {
                completeOnboarding();
              }
            );
          } else {
            slideAnim.value = withSpring(0);
          }
          setIsSliding(false);
        },
      }),
    [width, completeOnboarding]
  );

  const onScroll = (event: any) => {
    scrollX.value = event.nativeEvent.contentOffset.x;
  };

  const onMomentumScrollEnd = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const PaginationDot = ({ index }: { index: number }) => {
    const animatedStyle = useAnimatedStyle(() => {
      const inputRange = [
        (index - 1) * width,
        index * width,
        (index + 1) * width,
      ];

      const progress = interpolate(
        scrollX.value,
        inputRange,
        [0, 1, 0],
        Extrapolate.CLAMP
      );

      return {
        transform: [
          {
            scale: interpolate(progress, [0, 1], [0.8, 1.2], Extrapolate.CLAMP),
          },
        ],
        opacity: interpolate(progress, [0, 1], [0.4, 1], Extrapolate.CLAMP),
        backgroundColor: progress > 0.5 ? colors.secondary : colors.border,
      };
    });

    return <Animated.View style={[styles.dot, animatedStyle]} />;
  };

  const slideStyle = useMemo(
    () => ({
      width,
      flex: 1,
      backgroundColor: colors.background,
    }),
    [width]
  );

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        image: {
          width: width * 0.94,
          height: height * 0.5,
          borderRadius: 20,
          resizeMode: 'contain',
        },
        overlay: {
          position: 'absolute',
          bottom: 0,
          width: width,
          height: height * 0.15,
          justifyContent: 'center',
          alignItems: 'center',
        },
        sliderTrack: {
          width: width - 80,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#E5E7EB',
          justifyContent: 'center',
          paddingHorizontal: 4,
        },
      }),
    [width, height]
  );

  const renderSlide = ({
    item,
    index,
  }: {
    item: OnboardingSlide;
    index: number;
  }) => {
    return (
      <View style={slideStyle}>
        <View style={styles.imageContainer}>
          <Image source={item.image} style={dynamicStyles.image} />
        </View>

        <View style={styles.content}>
          <Text
            style={[typography.h1, { textAlign: 'center', color: colors.text }]}
          >
            {item.title}
          </Text>
          <Text
            style={[
              typography.h3,
              {
                fontWeight: '400',
                textAlign: 'center',
                color: colors.textSecondary,
              },
            ]}
          >
            {item.subtitle}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <PaginationDot key={index} index={index} />
          ))}
        </View>

        <View style={styles.navigation}>
          <View
            style={[
              styles.sliderContainer,
              {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 20,
              },
            ]}
          >
            {/* Skip Button */}
            <TouchableOpacity onPress={handleSkip}>
              <View style={{ paddingVertical: 10 }}>
                <Text
                  style={{
                    color: colors.secondary,
                    fontSize: 16,
                    fontWeight: '500',
                  }}
                >
                  Skip
                </Text>
              </View>
            </TouchableOpacity>

            {/* Next Button */}
            <TouchableOpacity onPress={handleNext}>
              <View
                style={[
                  styles.nextButton,
                  {
                    flexDirection: 'row',
                    backgroundColor: colors.secondary,
                    borderRadius: 25,
                    paddingHorizontal: 24,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingVertical: 10,
                  },
                ]}
              >
                <Text
                  style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}
                >
                  {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    flex: 5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingTop: 10,
  },
  content: {
    flex: 2,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  description: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pagination: {
    paddingLeft: 10,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  prevText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  nextText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  sliderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  sliderTrack: {
    // These will be handled by dynamicStyles
  },
  sliderThumb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});
