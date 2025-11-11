import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/styles/typography';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignupStart({}) {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { width: '100%', height: 50 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[typography.h3, { color: colors.text }]}>
          Choose Account Type
        </Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            paddingHorizontal: 24,
            paddingTop: 60,
            paddingBottom: 20,
          }}
        >
          {/* Logo */}
          <Image
            source={require('../assets/images/board_1.webp')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Title */}
          <Text style={styles.title}>Welcome to Chop Now</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Choose how you’d like to get started
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.secondary }]}
              onPress={() =>
                router.push({
                  pathname: 'signup' as any,
                  params: { role: 'customer' },
                })
              }
            >
              <Text style={styles.buttonText}>Continue as Customer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.sellerButton,
                {
                  borderColor: colors.secondary,
                  backgroundColor: 'transparent',
                  borderWidth: 2,
                },
              ]}
              onPress={() =>
                router.push({
                  pathname: 'signup' as any,
                  params: { role: 'vendor' },
                })
              }
            >
              <Text style={[styles.buttonText, { color: colors.secondary }]}>
                Continue as Vendor
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '90%',
    paddingVertical: 15,
    borderRadius: 12,
    marginVertical: 10,
    alignItems: 'center',
  },
  sellerButton: {
    borderWidth: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
