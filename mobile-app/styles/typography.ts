import { StyleSheet } from 'react-native';

export const typography = StyleSheet.create({
  // Heading styles
  h1: {
    fontSize: 50,
    fontFamily: 'DarkerGrotesque-ExtraBold',
    lineHeight: 50,
  },
  h2: {
    fontSize: 36,
    fontFamily: 'DarkerGrotesque-Bold',
    lineHeight: 36,
  },
  h3: {
    fontSize: 22,
    fontFamily: 'DarkerGrotesque-Regular',
    lineHeight: 24,
    fontWeight: 700,
  },

  // Body text styles
  body1: {
    fontSize: 19,
    fontFamily: 'DarkerGrotesque-Regular',
    lineHeight: 20,
    fontWeight: 400,
  },
  body2: {
    fontSize: 16,
    fontFamily: 'DarkerGrotesque-Regular',
    lineHeight: 24,
  },

  // Button text styles
  button1: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 24,
  },
  button2: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    lineHeight: 20,
  },

  // Caption styles
  caption1: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  caption2: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
}); 