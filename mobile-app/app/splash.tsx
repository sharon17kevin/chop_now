import { View, Image, Text, StyleSheet } from 'react-native';
import { SplashScreen } from 'expo-router';

export default function CustomSplash() {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/chopnow_logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.tagline}>Fresh Farm Produce, Delivered</Text>
      <Text style={styles.subtitle}>Your marketplace for local farmers</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 280,
    height: 280,
    marginBottom: 30,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d5f3e',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
});
