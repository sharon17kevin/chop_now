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
import { ArrowLeft } from 'lucide-react-native';
import { typography } from '@/styles/typography';

export default function EmailVerificationScreen() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();

  const handleVerifyOtp = async () => {
    if (otp.trim().length < 6) {
      Alert.alert(
        'Invalid Code',
        'Please enter the 6-digit code sent to your email.'
      );
      return;
    }

    setLoading(true);
    try {
      // Example verification logic (replace with your backend call)
      await new Promise((res) => setTimeout(res, 1500)); // mock delay

      Alert.alert('Success', 'Your email has been verified!');
      router.replace('/(tabs)'); // navigate to main app or next screen
    } catch (error) {
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    try {
      // Example: resend OTP API call
      await new Promise((res) => setTimeout(res, 1500)); // mock delay
      Alert.alert(
        'Code Resent',
        'A new verification code has been sent to your email.'
      );
    } catch (error) {
      Alert.alert('Error', 'Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
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
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code we sent to your email to complete
              verification.
            </Text>

            <TextInput
              placeholder="Enter verification code"
              placeholderTextColor="#aaa"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.input}
            />

            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.6 }, {backgroundColor: colors.secondary}]}
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
                <Text style={styles.resendText}>Resend Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backContainer}
            >
              <Text style={styles.backText}>Back</Text>
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
