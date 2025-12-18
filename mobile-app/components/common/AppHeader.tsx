import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AppHeaderProps {
    title?: string;
    showBack?: boolean;
    onBack?: () => void;
    rightElement?: React.ReactNode;
    style?: ViewStyle;
    transparent?: boolean;
}

export default function AppHeader({
    title,
    showBack = false,
    onBack,
    rightElement,
    style,
    transparent = false,
}: AppHeaderProps) {
    const { colors } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    return (
        <View
            style={[
                styles.container,
                {
                    paddingTop: insets.top + 10,
                    backgroundColor: transparent ? 'transparent' : colors.background,
                    borderBottomWidth: transparent ? 0 : 1,
                    borderBottomColor: transparent ? 'transparent' : colors.border,
                },
                style,
            ]}
        >
            <View style={styles.content}>
                <View style={styles.leftContainer}>
                    {showBack && (
                        <TouchableOpacity
                            onPress={handleBack}
                            style={[styles.backButton, { backgroundColor: colors.card }]}
                            activeOpacity={0.7}
                        >
                            <ArrowLeft size={20} color={colors.text} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.titleContainer}>
                    {title && (
                        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                            {title}
                        </Text>
                    )}
                </View>

                <View style={styles.rightContainer}>{rightElement}</View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 12,
        paddingHorizontal: 16,
        zIndex: 100,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 44,
    },
    leftContainer: {
        flex: 1,
        alignItems: 'flex-start',
    },
    titleContainer: {
        flex: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rightContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
});
