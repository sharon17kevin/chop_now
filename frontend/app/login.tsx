import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/styles/typography';
import { router } from 'expo-router';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User
} from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const shakeAnimation = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      shakeAnimation.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      return;
    }

    setIsLoading(true);
    buttonScale.value = withSpring(0.95);

    try {
      await login(email, password);
    } catch (error) {
      console.error('Login failed:', error);
      // Handle login error
    } finally {
      setIsLoading(false);
      buttonScale.value = withSpring(1);
    }
  };

const handleDemoLogin = async () => {
  setIsLoading(true);
  buttonScale.value = withSpring(0.95);
  try {
    // Replace with your actual demo credentials
    await login('demo@demo.com', 'demopassword');
  } catch (error) {
    console.error('Demo login failed:', error);
    // Optionally show an error message
  } finally {
    setIsLoading(false);
    buttonScale.value = withSpring(1);
  }
};

  const animatedFormStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shakeAnimation.value }],
    };
  });

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View
              style={[
                styles.logoBackground,
                { backgroundColor: colors.secondary },
              ]}
            >
              <User size={32} color={colors.buttonText} />
            </View>
            <Text style={[typography.h3, { color: colors.text }]}>
              Sign In Your Account
            </Text>
          </View>
        </View>

        <Animated.View
          style={[
            styles.formContainer,
            { backgroundColor: colors.card },
            animatedFormStyle,
          ]}
        >
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[typography.button2, { color: colors.text }]}>
                Email
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.inputBorder,
                  },
                  errors.email && { borderColor: colors.error },
                ]}
              >
                <Mail size={20} color={colors.textSecondary} />
                <TouchableOpacity
                  style={styles.inputWrapper}
                  activeOpacity={1}
                  onPress={() => emailInputRef.current?.focus()}
                >
                  <TextInput
                    ref={emailInputRef}
                    style={[
                      typography.body2,
                      { color: colors.text, flex: 1, height: '100%' },
                    ]}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </TouchableOpacity>
              </View>
              {errors.email && (
                <Text style={[typography.caption1, { color: colors.error }]}>
                  {errors.email}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[typography.button2, { color: colors.text }]}>
                Password
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.inputBorder,
                  },
                  errors.password && { borderColor: colors.error },
                ]}
              >
                <Lock size={20} color={colors.textSecondary} />
                <TouchableOpacity
                  style={styles.inputWrapper}
                  activeOpacity={1}
                  onPress={() => passwordInputRef.current?.focus()}
                >
                  <TextInput
                    ref={passwordInputRef}
                    style={[
                      typography.body2,
                      { color: colors.text, flex: 1, height: '100%' },
                    ]}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={[typography.caption1, { color: colors.error }]}>
                  {errors.password}
                </Text>
              )}
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={[typography.caption1, { color: colors.secondary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <Animated.View style={animatedButtonStyle}>
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  { backgroundColor: colors.secondary },
                  isLoading && styles.loginButtonLoading,
                ]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Text
                    style={[typography.button1, { color: colors.buttonText }]}
                  >
                    Signing In...
                  </Text>
                ) : (
                  <>
                    <Text
                      style={[typography.button1, { color: colors.buttonText }]}
                    >
                      Sign In
                    </Text>
                    <ArrowRight size={20} color={colors.buttonText} />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.divider}>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.border }]}
              />
              <Text
                style={[typography.caption1, { color: colors.textSecondary }]}
              >
                or
              </Text>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.border }]}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.demoButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[typography.button1, { color: colors.text }]}>
                Continue with Demo Account
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text
              style={[typography.caption1, { color: colors.textSecondary }]}
            >
              Don't have an account?{' '}
              <Text
                style={[typography.button2, { color: colors.secondary }]}
                onPress={() => router.push('/signup')}
              >
                Sign Up
              </Text>
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  logoBackground: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 32,
    paddingHorizontal: 20,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    height: '100%',
  },
  eyeButton: {
    padding: 8,
    margin: -8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  loginButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonLoading: {
    opacity: 0.8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  demoButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
});
