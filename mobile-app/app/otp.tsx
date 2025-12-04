import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-gesture-handler';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { usePendingSignup } from '@/stores/usePendingSignup';
import * as authService from '@/services/auth/auth';
import { ArrowLeft } from 'lucide-react-native';
import { typography } from '@/styles/typography';

export default function EmailVerificationScreen() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();
  const { verifyEmailOtp } = useAuth();
  const { pending, clear } = usePendingSignup();

  const handleVerifyOtp = async () => {
    if (otp.trim().length < 6) {
      Alert.alert(
        'Invalid Code',
        'Please enter the 6-digit code sent to your email.'
      );
      return;
    }

    if (!pending) {
      Alert.alert(
        'Error',
        'No pending signup found. Please try signing up again.'
      );
      router.back();
      return;
    }

    setLoading(true);

    console.log('🔐 Verifying OTP and creating account...');

    const result = await verifyEmailOtp(
      pending.email,
      otp.trim(),
      pending.name,
      pending.password,
      pending.role
    );

    if (!result.success) {
      setLoading(false);
      Alert.alert('Verification Failed', result.error);
      return;
    }

    // Success - clear pending data and navigation handled by verifyEmailOtp
    console.log('✅ Verification successful');
    clear();
    setLoading(false);
  };

  const handleResendCode = async () => {
    if (!pending?.email) {
      Alert.alert('Error', 'No email found. Please try signing up again.');
      return;
    }

    setResending(true);

    const result = await authService.resendEmailOtp(pending.email);

    setResending(false);

    if (!result.success) {
      Alert.alert(
        'Error',
        result.error || 'Could not resend code. Please try again.'
      );
      return;
    }

    Alert.alert(
      'Code Resent',
      'A new verification code has been sent to your email.'
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
          <Text style={[typography.h3, { color: colors.text }]}> </Text>
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
            <Text style={[styles.title, { color: colors.text }]}>
              Verify Your Email
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter the 6-digit code we sent to {pending?.email || 'your email'}{' '}
              to complete verification.
            </Text>

            <TextInput
              placeholder="Enter verification code"
              placeholderTextColor={colors.textSecondary}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              style={[
                styles.input,
                {
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.input,
                  color: colors.text,
                },
              ]}
            />

            <TouchableOpacity
              style={[
                styles.button,
                loading && { opacity: 0.6 },
                { backgroundColor: colors.secondary },
              ]}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify Email</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendContainer}
              onPress={handleResendCode}
              disabled={resending}
            >
              {resending ? (
                <ActivityIndicator color={colors.secondary} />
              ) : (
                <Text style={[styles.resendText, { color: colors.secondary }]}>
                  Resend Code
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backContainer}
            >
              <Text style={[styles.backText, { color: colors.textSecondary }]}>
                Back
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 25,
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    marginTop: 20,
  },
  resendText: {
    color: '#007bff',
    fontSize: 15,
    fontWeight: '500',
  },
  backContainer: {
    marginTop: 15,
  },
  backText: {
    color: '#666',
    fontSize: 15,
  },
});
