import { useTheme } from '@/hooks/useTheme';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';

interface Props {
  mode: string;
  first?: string;
  second?: string;
  onToggle: (mode: string) => void;
  disabled?: boolean;
  thumbColor?: string;
  size?: number;
}

export const SliderToggle: React.FC<Props> = ({
  mode,
  first = 'planned',
  second = 'completed',
  onToggle,
  disabled = false,
  thumbColor = '#fff',
  size = 40, // Default size for reasonable proportions
}) => {
  const animatedValue = useRef(new Animated.Value(mode === 'planned' ? 0 : 1)).current;
  const colors = useTheme().colors;

  useEffect(() => {
    console.log('Mode updated:', mode); // Debug mode changes
    Animated.timing(animatedValue, {
      toValue: mode === first ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [mode]);

  const handleToggle = (newMode: string) => {
    if (disabled || newMode === mode) {
      console.log('Toggle skipped: disabled or same mode', { disabled, newMode, currentMode: mode });
      return;
    }
    console.log('Toggling to:', newMode);
    Animated.timing(animatedValue, {
      toValue: newMode === first ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onToggle(newMode);
      AccessibilityInfo.announceForAccessibility(`Mode switched to ${newMode}`);
    });
  };

  // Interpolate translateX to move within the track bounds
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, size * 2 - 2], // Adjusted to stay within track padding
  });

  return (
    <View
      style={[
        styles.track,
        {
          width: size * 4,
          height: 30,
          borderRadius: size / 2,
          backgroundColor: colors.filter,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            width: size * 2 - 4,
            height: 25,
            borderRadius: (size - 4) / 2,
            backgroundColor: thumbColor || colors.textTransSub,
            transform: [{ translateX }],
          },
        ]}
      />
      <View style={styles.labels}>
        <Pressable
          onPress={() => handleToggle(first)}
          disabled={disabled}
          style={styles.labelContainer}
          accessibilityRole="button"
          accessibilityLabel="Select Planned mode"
          accessibilityState={{ disabled, selected: mode === first }}
        >
          <Text
            style={[
              styles.label,
              {
                color: colors.secondary,
                marginLeft: 10,
              },
            ]}
          >
            {first.charAt(0).toUpperCase() + first.slice(1)}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => handleToggle(second)}
          disabled={disabled}
          style={styles.labelContainer}
          accessibilityRole="button"
          accessibilityLabel="Select Completed mode"
          accessibilityState={{ disabled, selected: mode === second }}
        >
          <Text
            style={[
              styles.label,
              {
                color: colors.secondary,
                marginRight: 10,
              },
            ]}
          >
            {second.charAt(0).toUpperCase() + second.slice(1)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
    position: 'relative',
  },
  thumb: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  labels: {
    flexDirection: 'row',
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  labelContainer: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
