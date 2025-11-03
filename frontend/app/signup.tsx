import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useState, useRef } from 'react';
import { router } from 'expo-router';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/styles/typography';

export default function SignUpScreen() {
  const { signup } = useAuth();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const shakeAnimation = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const nameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  const validateForm = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      shakeAnimation.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      return;
    }

    setIsLoading(true);
    try {
      await signup(name, email, password);
      router.replace('/');
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({
        email: 'An error occurred during signup. Please try again.',
      });
    } finally {
      setIsLoading(false);
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>

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
              Create Your Account
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
                Full Name
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.inputBorder,
                  },
                  errors.name && { borderColor: colors.error },
                ]}
              >
                <User size={20} color={colors.textSecondary} />
                <TouchableOpacity
                  style={styles.inputWrapper}
                  activeOpacity={1}
                  onPress={() => nameInputRef.current?.focus()}
                >
                  <TextInput
                    ref={nameInputRef}
                    style={[
                      typography.body2,
                      { color: colors.text, flex: 1, height: '100%' },
                    ]}
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.textSecondary}
                    value={name}
                    onChangeText={setName}
                  />
                </TouchableOpacity>
              </View>
              {errors.name && (
                <Text style={[typography.caption1, { color: colors.error }]}>
                  {errors.name}
                </Text>
              )}
            </View>

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
                    placeholder="Create a password"
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

            <View style={styles.inputGroup}>
              <Text style={[typography.button2, { color: colors.text }]}>
                Confirm Password
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.inputBorder,
                  },
                  errors.confirmPassword && { borderColor: colors.error },
                ]}
              >
                <Lock size={20} color={colors.textSecondary} />
                <TouchableOpacity
                  style={styles.inputWrapper}
                  activeOpacity={1}
                  onPress={() => confirmPasswordInputRef.current?.focus()}
                >
                  <TextInput
                    ref={confirmPasswordInputRef}
                    style={[
                      typography.body2,
                      { color: colors.text, flex: 1, height: '100%' },
                    ]}
                    placeholder="Confirm your password"
                    placeholderTextColor={colors.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={[typography.caption1, { color: colors.error }]}>
                  {errors.confirmPassword}
                </Text>
              )}
            </View>

            <Animated.View style={animatedButtonStyle}>
              <TouchableOpacity
                style={[
                  styles.signUpButton,
                  { backgroundColor: colors.secondary },
                  isLoading && styles.signUpButtonLoading,
                ]}
                onPress={handleSignUp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Text
                    style={[typography.button1, { color: colors.buttonText }]}
                  >
                    Creating Account...
                  </Text>
                ) : (
                  <>
                    <Text
                      style={[typography.button1, { color: colors.buttonText }]}
                    >
                      Create Account
                    </Text>
                    <ArrowRight size={20} color={colors.buttonText} />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={styles.footer}>
            <Text
              style={[typography.caption1, { color: colors.textSecondary }]}
            >
              Already have an account?{' '}
              <Text
                style={[typography.button2, { color: colors.secondary }]}
                onPress={() => router.push('/login')}
              >
                Sign In
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
    paddingHorizontal: 24,
  },
  backButton: {
    marginBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBackground: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  formContainer: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
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
  signUpButton: {
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
  signUpButtonLoading: {
    opacity: 0.8,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
});
