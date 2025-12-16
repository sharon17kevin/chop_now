import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { typography } from '@/styles/typography';

interface Props {
  title?: string;
  onBack?: () => void;
}

export default function AppHeader({ title = 'Title', onBack }: Props) {
  const { colors } = useTheme();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={{
        ...styles.header,
      }}
    >
      <TouchableOpacity
        onPress={handleBack}
        style={{
          backgroundColor: 'white',
          width: 40,
          height: 40,
          borderRadius: 20,
          padding: 8,
          elevation: 3,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}
      >
        <ArrowLeft />
      </TouchableOpacity>
      <Text
        style={[
          typography.h2,
          styles.title,
          { color: colors.text, marginLeft: 20 },
        ]}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    marginTop: 10,
    marginBottom: 5,
  },
});
