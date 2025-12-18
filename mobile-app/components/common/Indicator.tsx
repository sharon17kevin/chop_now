import React from 'react';
import { View, Image, Dimensions } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const images = [
  'https://images.pexels.com/photos/1002703/pexels-photo-1002703.jpeg',
  'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg',
  'https://images.pexels.com/photos/34950/pexels-photo.jpg',
];

export default function Indicator({ progress, index }: { progress: SharedValue<number>; index: number }) {
  const animatedStyle = useAnimatedStyle(() => {
    const isActive = Math.round(progress.value) === index;
    return {
      width: withTiming(isActive ? 20 : 8, { duration: 250 }),
      backgroundColor: isActive ? '#f6891f' : '#ccc',
    };
  });
  return (
    <Animated.View
      style={[
        {
          height: 8,
          borderRadius: 4,
          marginHorizontal: 4,
        },
        animatedStyle,
      ]}
    />
  );
};