import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/useUserStore';
import { useRouter } from 'expo-router';
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

interface AddressFormProps {
    onSuccess?: () => void;
    initialData?: any;
}

export default function AddressForm({ onSuccess, initialData }: AddressFormProps) {
    const { colors } = useTheme();
    const router = useRouter();
    const { profile } = useUserStore();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        street: initialData?.street || '',
        city: initialData?.city || '',
        state: initialData?.state || '',
        zip: initialData?.zip || '',
        label: initialData?.label || 'Home',
        is_default: initialData?.is_default || false,
    });

    const handleSubmit = async () => {
        if (!profile?.id) return;
        if (!formData.street || !formData.city || !formData.state) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase.from('addresses').insert({
                user_id: profile.id,
                street: formData.street,
                city: formData.city,
                state: formData.state,
                zip: formData.zip,
                label: formData.label,
                is_default: formData.is_default,
            });

            if (error) throw error;

            Alert.alert('Success', 'Address saved successfully');
            if (onSuccess) onSuccess();
            else router.back();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Label</Text>
                <View style={styles.chipContainer}>
                    {['Home', 'Work', 'Other'].map((l) => (
                        <TouchableOpacity
                            key={l}
                            style={[
                                styles.chip,
                                {
                                    backgroundColor:
                                        formData.label === l ? colors.primary : colors.filter,
                                },
                            ]}
                            onPress={() => setFormData({ ...formData, label: l })}
                        >
                            <Text
                                style={[
                                    styles.chipText,
                                    {
                                        color:
                                            formData.label === l ? colors.buttonText : colors.text,
                                    },
                                ]}
                            >
                                {l}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Street Address</Text>
                <TextInput
                    style={[
                        styles.input,
                        {
                            backgroundColor: colors.filter,
                            color: colors.text,
                            borderColor: colors.border,
                        },
                    ]}
                    value={formData.street}
                    onChangeText={(t) => setFormData({ ...formData, street: t })}
                    placeholder="123 Main St"
                    placeholderTextColor={colors.textSecondary}
                />
            </View>

            <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>City</Text>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.filter,
                                color: colors.text,
                                borderColor: colors.border,
                            },
                        ]}
                        value={formData.city}
                        onChangeText={(t) => setFormData({ ...formData, city: t })}
                        placeholder="City"
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>State</Text>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.filter,
                                color: colors.text,
                                borderColor: colors.border,
                            },
                        ]}
                        value={formData.state}
                        onChangeText={(t) => setFormData({ ...formData, state: t })}
                        placeholder="State"
                        placeholderTextColor={colors.textSecondary}
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
                        Save Address
                    </Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
    },
    button: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'Bold',
    },
    chipContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    chipText: {
        fontWeight: '600',
    },
});
