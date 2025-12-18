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

interface PaymentMethodFormProps {
    onSuccess?: () => void;
}

export default function PaymentMethodForm({ onSuccess }: PaymentMethodFormProps) {
    const { colors } = useTheme();
    const [loading, setLoading] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');

    const handleSubmit = async () => {
        if (cardNumber.length < 16 || expiry.length < 5 || cvc.length < 3) {
            Alert.alert('Error', 'Invalid card details');
            return;
        }

        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            Alert.alert('Success', 'Payment method added');
            if (onSuccess) onSuccess();
        }, 1500);
    };

    return (
        <View style={styles.container}>
            <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Card Number</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.filter, color: colors.text, borderColor: colors.border }]}
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    placeholder="0000 0000 0000 0000"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    maxLength={19}
                />
            </View>

            <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Expiry Date</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.filter, color: colors.text, borderColor: colors.border }]}
                        value={expiry}
                        onChangeText={setExpiry}
                        placeholder="MM/YY"
                        placeholderTextColor={colors.textSecondary}
                        maxLength={5}
                    />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>CVC</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.filter, color: colors.text, borderColor: colors.border }]}
                        value={cvc}
                        onChangeText={setCvc}
                        placeholder="123"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                        maxLength={3}
                        secureTextEntry
                    />
                </View>
            </View>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={colors.buttonText} />
                ) : (
                    <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                        Add Card
                    </Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16 },
    formGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    input: { padding: 12, borderRadius: 8, borderWidth: 1, fontSize: 16 },
    row: { flexDirection: 'row' },
    button: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
    buttonText: { fontSize: 16, fontWeight: 'bold' },
});
