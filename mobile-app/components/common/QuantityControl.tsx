import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../styles/typography';

interface QuantityControlProps {
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  product: {
    stock: number;
    minimum_order_quantity?: number;
    order_increment?: number;
  };
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

export default function QuantityControl({
  quantity,
  onQuantityChange,
  product,
  size = 'medium',
  disabled = false,
}: QuantityControlProps) {
  const { colors } = useTheme();
  
  const minQty = product.minimum_order_quantity || 1;
  const incrementValue = product.order_increment || 1;
  const maxQty = product.stock;

  const increment = () => {
    if (disabled) return;
    const newQuantity = quantity + incrementValue;
    onQuantityChange(Math.min(newQuantity, maxQty));
  };

  const decrement = () => {
    if (disabled) return;
    const newQuantity = quantity - incrementValue;
    onQuantityChange(Math.max(newQuantity, minQty));
  };

  const canDecrement = quantity > minQty;
  const canIncrement = quantity < maxQty;

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return { width: 28, height: 28, fontSize: 16 };
      case 'large':
        return { width: 44, height: 44, fontSize: 20 };
      default:
        return { width: 36, height: 36, fontSize: 18 };
    }
  };

  const buttonSize = getButtonSize();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={decrement}
        disabled={disabled || !canDecrement}
        style={[
          styles.button,
          {
            borderColor: colors.inputBorder,
            backgroundColor: colors.background,
            width: buttonSize.width,
            height: buttonSize.height,
          },
          (!canDecrement || disabled) && { opacity: 0.5 },
        ]}
      >
        <Text
          style={[
            styles.buttonText,
            { color: colors.text, fontSize: buttonSize.fontSize },
          ]}
        >
          -
        </Text>
      </TouchableOpacity>

      <Text
        style={[
          typography.body2,
          styles.quantity,
          { color: colors.text, fontSize: buttonSize.fontSize },
        ]}
      >
        {quantity}
      </Text>

      <TouchableOpacity
        onPress={increment}
        disabled={disabled || !canIncrement}
        style={[
          styles.button,
          {
            borderColor: colors.inputBorder,
            backgroundColor: colors.background,
            width: buttonSize.width,
            height: buttonSize.height,
          },
          (!canIncrement || disabled) && { opacity: 0.5 },
        ]}
      >
        <Text
          style={[
            styles.buttonText,
            { color: colors.text, fontSize: buttonSize.fontSize },
          ]}
        >
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  button: {
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
    lineHeight: 20,
  },
  quantity: {
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 32,
  },
});