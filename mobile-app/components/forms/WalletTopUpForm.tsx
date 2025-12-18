import { useTheme } from '@/hooks/useTheme';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function WalletTopUpForm() {
    const { colors } = useTheme();
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTopUp = () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) < 100) {
            Alert.alert('Invalid Amount', 'Minimum top-up is ₦100');
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            Alert.alert('Success', `Successfully added ₦${amount} to wallet`);
            setAmount('');
        }, 1500);
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: colors.text }]}>Top Up Wallet</Text>
            <View style={styles.inputContainer}>
                <Text style={[styles.currency, { color: colors.textSecondary }]}>₦</Text>
                <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                />
            </View>
            <View style={styles.presets}>
                {[500, 1000, 5000].map((val) => (
                    <TouchableOpacity
                        key={val}
                        style={[styles.chip, { backgroundColor: colors.filter }]}
                        onPress={() => setAmount(val.toString())}
                    >
                        <Text style={{ color: colors.text }}>₦{val}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={handleTopUp}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Top Up Now</Text>}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16 },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16 },
    currency: { fontSize: 20, marginRight: 8 },
    input: { flex: 1, paddingVertical: 12, fontSize: 20 },
    presets: { flexDirection: 'row', gap: 10, marginVertical: 16 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    button: { padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold' },
});
