import { useTheme } from '@/hooks/useTheme';
import { MapPin, Navigation } from 'lucide-react-native';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const MOCK_TASKS = [
    { id: '1', type: 'Pickup', address: '12 Farm Road', status: 'pending' },
    { id: '2', type: 'Dropoff', address: '45 Main St', status: 'pending' },
];

export default function TaskList() {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: colors.text }]}>Today's Route</Text>
            <FlatList
                data={MOCK_TASKS}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        <View style={styles.left}>
                            <View style={[styles.dot, { backgroundColor: item.type === 'Pickup' ? colors.primary : colors.secondary }]} />
                            <View style={[styles.line, { backgroundColor: colors.border, opacity: index === MOCK_TASKS.length - 1 ? 0 : 1 }]} />
                        </View>
                        <View style={styles.content}>
                            <Text style={[styles.type, { color: colors.textSecondary }]}>{item.type}</Text>
                            <Text style={[styles.address, { color: colors.text }]}>{item.address}</Text>
                        </View>
                        <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.filter }]}>
                            <Navigation size={20} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
    card: { flexDirection: 'row', padding: 16, borderRadius: 12, marginBottom: 12 },
    left: { alignItems: 'center', marginRight: 12 },
    dot: { width: 12, height: 12, borderRadius: 6 },
    line: { width: 2, flex: 1, marginVertical: 4 },
    content: { flex: 1 },
    type: { fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold' },
    address: { fontSize: 16, fontWeight: '500', marginTop: 4 },
    navBtn: { padding: 10, borderRadius: 8 },
});
