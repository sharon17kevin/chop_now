import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';

const { width: screenWidth } = Dimensions.get('window');
const SLIDER_WIDTH = screenWidth - 80;
const THUMB_SIZE = 58;
const COMPLETE_THRESHOLD = SLIDER_WIDTH * 0.7;
const MAX_TRANSLATION = SLIDER_WIDTH - THUMB_SIZE - 10;

export default function SliderButton() {
  const { colors } = useTheme();
  const { completeOnboarding } = useAuth();
  const translateX = useSharedValue(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isComplete) {
      console.log('Calling completeOnboarding...');
      completeOnboarding().catch((e) =>
        console.error('completeOnboarding error', e)
      );
    }
  }, [isComplete]);

  const handleComplete = () => {
    console.log('Calling completeOnboarding...');
    completeOnboarding().catch((e) =>
      console.error('completeOnboarding error', e)
    );
    console.log('completeOnboarding called');
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      // Optional: Add haptic feedback here
    })
    .onUpdate((event) => {
      // Only allow dragging to the right and clamp within bounds
      if (event.translationX > 0) {
        translateX.value = Math.min(event.translationX, MAX_TRANSLATION);
      }
    })
    .onEnd((event) => {
      const shouldComplete =
        event.translationX > COMPLETE_THRESHOLD || event.velocityX > 500;

      if (shouldComplete) {
        // Snap to complete position with a nice easing
        translateX.value = withTiming(
          MAX_TRANSLATION,
          {
            duration: 300,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          },
          () => {
            'worklet';
            runOnJS(setIsComplete)(true);
            console.log('Animation complete');
          }
        );
      } else {
        // Snap back to start with a spring animation
        translateX.value = withSpring(0, {
          velocity: event.velocityX,
          damping: 20,
          stiffness: 200,
          mass: 0.5,
          overshootClamping: true,
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 0.01,
        });
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <View style={[styles.track, { backgroundColor: colors.border }]}>
          <Text style={[styles.trackText, { color: colors.text }]}>
            Start Now
          </Text>
          <Animated.View
            style={[
              styles.thumb,
              { backgroundColor: colors.secondary },
              thumbStyle,
            ]}
          >
            <ArrowRight size={20} color="#FFFFFF" />
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SLIDER_WIDTH,
    height: THUMB_SIZE,
    justifyContent: 'center',
  },
  track: {
    width: '100%',
    height: THUMB_SIZE + 10,
    borderRadius: (THUMB_SIZE + 10) / 2,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  trackText: {
    position: 'absolute',
    left: 120,
    fontSize: 16,
    fontWeight: '500',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});
