import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import AppHeader from '@/components/AppHeader';

export default function Breakdown() {
    const { colors } = useTheme();
  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
        <AppHeader title='Order Breakdown'/>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    
});
