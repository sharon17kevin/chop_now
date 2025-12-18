import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function PlaceholderComponent() {
    const { colors } = useTheme();
    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            <Text style={[styles.text, { color: colors.textSecondary }]}>
                Component Coming Soon
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee',
        margin: 10,
    },
    text: {
        fontSize: 14,
        fontStyle: 'italic',
    },
});
