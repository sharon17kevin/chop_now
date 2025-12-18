import { useTheme } from '@/hooks/useTheme';
import { ChefHat, Clock } from 'lucide-react-native';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const MOCK_ORDERS = [
    { id: '101', items: ['Jollof Rice', 'Chicken'], status: 'new', time: '10:30 AM' },
    { id: '102', items: ['Fried Rice', 'Plantain'], status: 'preparing', time: '10:32 AM' },
];

export default function OrderQueue() {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            <Text style={[styles.header, { color: colors.text }]}>Kitchen Queue</Text>
            <FlatList
                data={MOCK_ORDERS}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: colors.card, borderLeftColor: item.status === 'new' ? colors.error : colors.warning }]}>
                        <View style={styles.top}>
                            <Text style={{ fontWeight: 'bold', color: colors.text }}>#{item.id}</Text>
                            <View style={styles.timeTag}>
                                <Clock size={12} color={colors.textSecondary} />
                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 4 }}>{item.time}</Text>
                            </View>
                        </View>
                        <Text style={[styles.items, { color: colors.textSecondary }]}>{item.items.join(', ')}</Text>
                        <View style={styles.actions}>
                            <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]}>
                                <ChefHat size={16} color="#fff" />
                                <Text style={styles.btnText}>{item.status === 'new' ? 'Start Cooking' : 'Ready'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    header: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
    card: { padding: 16, borderRadius: 8, marginBottom: 12, borderLeftWidth: 4, elevation: 1 },
    top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    timeTag: { flexDirection: 'row', alignItems: 'center' },
    items: { fontSize: 16, marginBottom: 16 },
    actions: { flexDirection: 'row', justifyContent: 'flex-end' },
    btn: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignItems: 'center', gap: 8 },
    btnText: { color: '#fff', fontWeight: 'bold' },
});
