import { useTheme } from '@/hooks/useTheme';
import { Clock } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function DeliveryTimer({ targetTime }: { targetTime: Date }) {
    const { colors } = useTheme();
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const diff = targetTime.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('Overdue');
                clearInterval(timer);
                return;
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${minutes}m ${seconds}s`);
        }, 1000);

        return () => clearInterval(timer);
    }, [targetTime]);

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            <Clock size={20} color={colors.primary} />
            <View>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Time Remaining</Text>
                <Text style={[styles.time, { color: colors.text }]}>{timeLeft}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 12,
        elevation: 2,
    },
    label: { fontSize: 12 },
    time: { fontSize: 18, fontWeight: 'bold' },
});
