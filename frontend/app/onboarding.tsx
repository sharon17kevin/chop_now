import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { useState, useRef, useMemo } from 'react';
import { FlatList } from 'react-native';
import { router } from 'expo-router';
import {
  Package,
  Truck,
  ChartBar as BarChart3,
  Users,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/styles/typography';
import { LinearGradient } from 'expo-linear-gradient';
import SliderButton from '@/components/SliderButton';

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  icon: any;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Find Your Way Around',
    subtitle: 'Real-time Visibility',
    description:
      'Monitor all your deliveries in real-time with comprehensive tracking and status updates for complete logistics visibility.',
    image:
      'https://images.unsplash.com/photo-1601231509500-a54c372447da?w=1200&q=80&fm=webp',
    icon: Package,
    color: '#1E40AF',
  },
  {
    id: '2',
    title: 'Connect To Your City',
    subtitle: 'Smart Delivery Planning',
    description:
      'Intelligent route optimization reduces delivery time and fuel costs while ensuring maximum efficiency for your fleet.',
    image:
      'https://images.unsplash.com/photo-1529171918672-ba6d0733a56c?w=1200&q=80&fm=webp',
    icon: Truck,
    color: '#F97316',
  },
  {
    id: '3',
    title: 'Optimize Your Trips',
    subtitle: 'Driver Coordination',
    description:
      'Coordinate your delivery team with real-time communication, performance tracking, and workload distribution.',
    image:
      'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Users,
    color: '#10B981',
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
    //const { colors } = useTheme();
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
          height: height * 0.55,
          borderRadius: 20,
          resizeMode: 'cover',
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
    const Icon = item.icon;

    return (
      <View style={slideStyle}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={dynamicStyles.image} />
          <LinearGradient
            colors={[
              colors.background + '00',
              colors.background + '00',
              colors.background + '66',
              colors.background + 'FF',
              colors.background + 'FF',
            ]}
            style={dynamicStyles.overlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </View>

        <View style={styles.content}>
          <Text style={[typography.h1, { color: colors.text }]}>
            {item.title}
          </Text>
          <Text style={[typography.body2, { color: colors.textSecondary }]}>
            {item.description}
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
          <View style={styles.sliderContainer}>
            <SliderButton/>
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
    paddingLeft: 25,
    paddingRight: 10,
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
