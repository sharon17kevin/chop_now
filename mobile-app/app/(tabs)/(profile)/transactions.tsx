import AppHeader from '@/components/common/AppHeader';
import { useTheme } from '@/hooks/useTheme';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DUMMY_TRANSACTIONS = [
    { id: '1', type: 'credit', amount: 5000, description: 'Wallet Top Up', date: '2025-05-12' },
    { id: '2', type: 'debit', amount: 2400, description: 'Order #1234Payment', date: '2025-05-10' },
    { id: '3', type: 'debit', amount: 1500, description: 'Order #1122 Payment', date: '2025-05-08' },
];

export default function TransactionsScreen() {
    const { colors } = useTheme();

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <View style={[styles.icon, { backgroundColor: item.type === 'credit' ? colors.success + '20' : colors.error + '20' }]}>
                {item.type === 'credit' ?
                    <ArrowDownLeft size={20} color={colors.success} /> :
                    <ArrowUpRight size={20} color={colors.error} />
                }
            </View>
            <View style={styles.details}>
                <Text style={[styles.desc, { color: colors.text }]}>{item.description}</Text>
                <Text style={[styles.date, { color: colors.textSecondary }]}>{item.date}</Text>
            </View>
            <Text style={[styles.amount, { color: item.type === 'credit' ? colors.success : colors.text }]}>
                {item.type === 'credit' ? '+' : '-'}₦{item.amount.toLocaleString()}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <AppHeader title="Transaction History" showBack />
            <FlatList
                data={DUMMY_TRANSACTIONS}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    list: { padding: 16 },
    card: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
    icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    details: { flex: 1 },
    desc: { fontSize: 16, fontWeight: '500' },
    date: { fontSize: 12, marginTop: 4 },
    amount: { fontSize: 16, fontWeight: 'bold' },
});
