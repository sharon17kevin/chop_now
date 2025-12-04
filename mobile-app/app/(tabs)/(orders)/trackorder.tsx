import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/hooks/useTheme'
import AppHeader from '@/components/AppHeader'

export default function TrackOrder() {
  const { colors } = useTheme()

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Track Order" />
      <View style={[styles.content, { backgroundColor: colors.card }]}>
        <Text style={[styles.text, { color: colors.text }]}>Track Order</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
  },
})