import { useTheme } from '@/hooks/useTheme';
import { PackageX } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface EmptyStateProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    actionLabel?: string;
    onAction?: () => void;
    style?: ViewStyle;
}

export default function EmptyState({
    title,
    subtitle,
    icon,
    actionLabel,
    onAction,
    style,
}: EmptyStateProps) {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, style]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
                {icon || <PackageX size={48} color={colors.textSecondary} />}
            </View>

            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

            {subtitle && (
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {subtitle}
                </Text>
            )}

            {actionLabel && onAction && (
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={onAction}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                        {actionLabel}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
        maxWidth: 280,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
