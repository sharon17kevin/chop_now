import { useTheme } from '@/hooks/useTheme';
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Text,
  TouchableOpacity,
} from 'react-native';

interface FilterSquareProps {
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
  text?: string;
  onPress?: () => void;
  isSelected?: boolean;
}

const FilterSquare: React.FC<FilterSquareProps> = ({
  style,
  icon,
  text,
  onPress,
  isSelected = false,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.square,
        style,
        {
          backgroundColor: colors.background,
          borderWidth: isSelected ? 2 : 0,
          borderColor: colors.text,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: "#E0E0E0" },
        ]}
      >
        {icon}
      </View>
      <Text
        style={[
          styles.text,
          { color: colors.text },
        ]}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  square: {
    width: 70,
    height: 90,
    backgroundColor: 'yellow',
    margin: 4,
    borderRadius: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 8,
    flex: 1,
  },
  text: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginTop: 4,
    paddingVertical: 2,
  },
  checkbox: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default FilterSquare;