import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';

interface LoadingSpinnerProps {
    size?: 'small' | 'large';
    color?: string;
    fullscreen?: boolean;
    style?: ViewStyle;
}

export default function LoadingSpinner({
    size = 'large',
    color,
    fullscreen = false,
    style,
}: LoadingSpinnerProps) {
    const { colors } = useTheme();

    if (fullscreen) {
        return (
            <View style={[styles.fullscreen, { backgroundColor: colors.background }, style]}>
                <ActivityIndicator size={size} color={color || colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            <ActivityIndicator size={size} color={color || colors.primary} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreen: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
});
