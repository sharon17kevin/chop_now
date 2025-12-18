import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { CheckCircle, Home, ShoppingBag } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withDelay,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaymentSuccessScreen() {
    const { colors } = useTheme();
    const router = useRouter();

    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        scale.value = withSpring(1, { damping: 12 });
        opacity.value = withDelay(500, withSpring(1));
    }, []);

    const animatedIconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const animatedContentStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const handleContinueShopping = () => {
        router.replace('/(tabs)/(home)' as any);
    };

    const handleViewOrder = () => {
        router.replace('/(tabs)/(orders)' as any);
    };

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <View style={styles.content}>
                <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
                    <CheckCircle size={100} color={colors.success} fill={colors.background} />
                </Animated.View>

                <Animated.View style={[styles.textContainer, animatedContentStyle]}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        Order Placed Successfully!
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Thank you for your purchase. Your order has been received and is being processed.
                    </Text>
                </Animated.View>

                <Animated.View style={[styles.buttonsContainer, animatedContentStyle]}>
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                        onPress={handleContinueShopping}
                    >
                        <Home size={20} color={colors.buttonText} />
                        <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                            Continue Shopping
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.secondaryButton,
                            { backgroundColor: colors.card, borderColor: colors.border },
                        ]}
                        onPress={handleViewOrder}
                    >
                        <ShoppingBag size={20} color={colors.text} />
                        <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                            View Order Details
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    iconContainer: {
        marginBottom: 32,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    buttonsContainer: {
        width: '100%',
        gap: 16,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 12,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
