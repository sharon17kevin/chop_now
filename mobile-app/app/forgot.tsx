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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Missing Email', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      // Example: Supabase or Firebase password reset
      // await supabase.auth.resetPasswordForEmail(email);
      await new Promise((res) => setTimeout(res, 1500)); // mock delay

      Alert.alert(
        'Check your inbox',
        'We’ve sent a password reset code to your email.'
      );
      router.push({
        pathname: 'otp' as any,
      });
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
        style={[styles.container, { backgroundColor: 'colors.background' }]}
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
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email below and we’ll send you a link to reset your
              password.
            </Text>

            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
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
              <Text style={styles.backText}>Back to Login</Text>
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
    color: '#111',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  dummy: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
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
    color: '#FF6600',
    fontSize: 15,
    fontWeight: '500',
  },
});
