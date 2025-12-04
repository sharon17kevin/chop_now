import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { typography } from '@/styles/typography';
import { useTheme } from '@/hooks/useTheme';

interface ReviewCardProps {
  reviewer: string;
  rating: number;
  text: string;
  date: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  reviewer,
  rating,
  text,
  date,
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background,
          borderColor: colors.textSecondary,
        },
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[typography.body1, { color: colors.text, fontWeight: 'bold' }]}
        >
          {reviewer}
        </Text>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}
        >
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              fill={i < rating ? colors.secondary : 'none'}
              color={colors.secondary}
              style={{ marginRight: 2 }}
            />
          ))}
        </View>
      </View>
      <Text
        style={[
          typography.body2,
          { color: colors.textSecondary, marginVertical: 6 },
        ]}
      >
        {text}
      </Text>
      <Text
        style={[
          typography.caption1,
          { color: colors.textSecondary, textAlign: 'right' },
        ]}
      >
        {date}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
});

export default ReviewCard;
