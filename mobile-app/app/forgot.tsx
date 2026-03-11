import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { ArrowLeft } from 'lucide-react-native';
import { typography } from '@/styles/typography';
import { ScrollView } from 'react-native-gesture-handler';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Missing Email', 'Please enter your email address.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

      if (error) {
        Alert.alert('Error', error.message || 'Failed to send reset email.');
        return;
      }

      setSent(true);
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
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
            {sent ? (
              <>
                <Text style={[styles.title, { color: colors.text }]}>
                  Check Your Inbox
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  We've sent a password reset link to {email}. Check your email
                  and follow the instructions to reset your password.
                </Text>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.secondary }]}
                  onPress={() => router.replace('/login')}
                >
                  <Text style={styles.buttonText}>Back to Login</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setSent(false);
                  }}
                  style={styles.backContainer}
                >
                  <Text
                    style={[styles.resendText, { color: colors.secondary }]}
                  >
                    Didn't receive it? Try again
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.title, { color: colors.text }]}>
                  Forgot Password?
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  Enter your email below and we'll send you a link to reset your
                  password.
                </Text>

                <TextInput
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
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
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.backContainer}
                >
                  <Text
                    style={[styles.backText, { color: colors.textSecondary }]}
                  >
                    Back to Login
                  </Text>
                </TouchableOpacity>
              </>
            )}
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
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  backContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  backText: {
    fontSize: 15,
    fontWeight: '500',
  },
  resendText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
