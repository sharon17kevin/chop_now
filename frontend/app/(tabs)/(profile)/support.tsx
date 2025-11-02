import { ScrollView, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import AppHeader from '@/components/AppHeader';

export default function Support() {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <AppHeader title="Support" />
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
