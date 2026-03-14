import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { AdminService, PromoCodeInput } from '@/services/admin';
import { Pencil, Plus, Trash2, X } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  vendor_id: string | null;
  applicable_categories: string[] | null;
  created_at: string;
}

const EMPTY_FORM: PromoCodeInput = {
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: 0,
  min_order_amount: 0,
  max_discount_amount: undefined,
  usage_limit: undefined,
  per_user_limit: 1,
  valid_from: new Date().toISOString(),
  valid_until: null,
  is_active: true,
};

export default function PromoCodesManagement() {
  const { colors } = useTheme();

  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoCodeInput>(EMPTY_FORM);

  const fetchCodes = async () => {
    try {
      const data = await AdminService.getPromoCodes();
      setCodes(data);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCodes();
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCodes();
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, valid_from: new Date().toISOString() });
    setShowForm(true);
  };

  const openEditForm = (promo: PromoCode) => {
    setEditingId(promo.id);
    setForm({
      code: promo.code,
      description: promo.description || '',
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      min_order_amount: promo.min_order_amount,
      max_discount_amount: promo.max_discount_amount || undefined,
      usage_limit: promo.usage_limit || undefined,
      per_user_limit: promo.per_user_limit,
      valid_from: promo.valid_from,
      valid_until: promo.valid_until,
      is_active: promo.is_active,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.code.trim()) {
      Alert.alert('Validation', 'Promo code is required.');
      return;
    }
    if (!form.discount_value || form.discount_value <= 0) {
      Alert.alert('Validation', 'Discount value must be greater than 0.');
      return;
    }
    if (form.discount_type === 'percentage' && form.discount_value > 100) {
      Alert.alert('Validation', 'Percentage cannot exceed 100%.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase().trim(),
      };
      if (editingId) {
        await AdminService.updatePromoCode(editingId, payload);
      } else {
        await AdminService.createPromoCode(payload);
      }
      closeForm();
      fetchCodes();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save promo code.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (promo: PromoCode) => {
    Alert.alert(
      'Delete Promo Code',
      `Delete "${promo.code}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AdminService.deletePromoCode(promo.id);
              fetchCodes();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete.');
            }
          },
        },
      ],
    );
  };

  const toggleActive = async (promo: PromoCode) => {
    try {
      await AdminService.updatePromoCode(promo.id, {
        is_active: !promo.is_active,
      });
      fetchCodes();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update.');
    }
  };

  const getPromoStatus = (promo: PromoCode) => {
    const now = new Date();
    const end = promo.valid_until ? new Date(promo.valid_until) : null;
    const depleted =
      promo.usage_limit !== null && promo.usage_count >= promo.usage_limit;

    if (!promo.is_active) return { label: 'Inactive', color: '#6b7280' };
    if (depleted) return { label: 'Depleted', color: '#ef4444' };
    if (end && end < now) return { label: 'Expired', color: '#ef4444' };
    return { label: 'Active', color: '#10b981' };
  };

  const formatDiscount = (promo: PromoCode) => {
    if (promo.discount_type === 'percentage') {
      return `${promo.discount_value}% off`;
    }
    return `\u20A6${promo.discount_value.toLocaleString()} off`;
  };

  if (loading) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={[]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.secondary}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.heading, { color: colors.text }]}>
            Promo Codes ({codes.length})
          </Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.secondary }]}
            onPress={openCreateForm}
          >
            <Plus size={18} color="#fff" />
            <Text style={styles.addBtnText}>Create</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        {showForm && (
          <View
            style={[
              styles.formCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: colors.text }]}>
                {editingId ? 'Edit Promo Code' : 'New Promo Code'}
              </Text>
              <TouchableOpacity onPress={closeForm}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Code *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              value={form.code}
              onChangeText={(v) => setForm({ ...form, code: v.toUpperCase() })}
              placeholder="e.g. WELCOME10"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Description
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              value={form.description || ''}
              onChangeText={(v) => setForm({ ...form, description: v })}
              placeholder="Optional description"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Discount Type
            </Text>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      form.discount_type === 'percentage'
                        ? colors.secondary
                        : colors.input,
                    borderColor:
                      form.discount_type === 'percentage'
                        ? colors.secondary
                        : colors.inputBorder,
                  },
                ]}
                onPress={() =>
                  setForm({ ...form, discount_type: 'percentage' })
                }
              >
                <Text
                  style={{
                    color:
                      form.discount_type === 'percentage'
                        ? '#fff'
                        : colors.text,
                    fontSize: 13,
                    fontWeight: '600',
                  }}
                >
                  Percentage
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      form.discount_type === 'fixed'
                        ? colors.secondary
                        : colors.input,
                    borderColor:
                      form.discount_type === 'fixed'
                        ? colors.secondary
                        : colors.inputBorder,
                  },
                ]}
                onPress={() => setForm({ ...form, discount_type: 'fixed' })}
              >
                <Text
                  style={{
                    color:
                      form.discount_type === 'fixed' ? '#fff' : colors.text,
                    fontSize: 13,
                    fontWeight: '600',
                  }}
                >
                  Fixed (\u20A6)
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Discount Value *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.input,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    },
                  ]}
                  value={form.discount_value ? String(form.discount_value) : ''}
                  onChangeText={(v) =>
                    setForm({
                      ...form,
                      discount_value: parseFloat(v) || 0,
                    })
                  }
                  keyboardType="decimal-pad"
                  placeholder={
                    form.discount_type === 'percentage' ? '10' : '500'
                  }
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              {form.discount_type === 'percentage' && (
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Max Discount (\u20A6)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.input,
                        borderColor: colors.inputBorder,
                        color: colors.text,
                      },
                    ]}
                    value={
                      form.max_discount_amount
                        ? String(form.max_discount_amount)
                        : ''
                    }
                    onChangeText={(v) =>
                      setForm({
                        ...form,
                        max_discount_amount: parseFloat(v) || undefined,
                      })
                    }
                    keyboardType="decimal-pad"
                    placeholder="No cap"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              )}
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Min Order (\u20A6)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.input,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    },
                  ]}
                  value={
                    form.min_order_amount ? String(form.min_order_amount) : ''
                  }
                  onChangeText={(v) =>
                    setForm({
                      ...form,
                      min_order_amount: parseFloat(v) || 0,
                    })
                  }
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Usage Limit
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.input,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    },
                  ]}
                  value={form.usage_limit ? String(form.usage_limit) : ''}
                  onChangeText={(v) =>
                    setForm({
                      ...form,
                      usage_limit: parseInt(v) || undefined,
                    })
                  }
                  keyboardType="number-pad"
                  placeholder="Unlimited"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Per User Limit
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.input,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    },
                  ]}
                  value={form.per_user_limit ? String(form.per_user_limit) : ''}
                  onChangeText={(v) =>
                    setForm({
                      ...form,
                      per_user_limit: parseInt(v) || 1,
                    })
                  }
                  keyboardType="number-pad"
                  placeholder="1"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View
                style={{
                  flex: 1,
                  marginLeft: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 8,
                  paddingTop: 20,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 14 }}>Active</Text>
                <Switch
                  value={form.is_active}
                  onValueChange={(v) => setForm({ ...form, is_active: v })}
                  trackColor={{
                    false: colors.border,
                    true: colors.secondary,
                  }}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: colors.secondary },
                saving && { opacity: 0.6 },
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {editingId ? 'Update Code' : 'Create Code'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Code List */}
        {codes.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ color: colors.textSecondary, fontSize: 15 }}>
              No promo codes yet. Create one to get started.
            </Text>
          </View>
        ) : (
          codes.map((promo) => {
            const status = getPromoStatus(promo);
            return (
              <View
                key={promo.id}
                style={[
                  styles.promoCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.promoTop}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.codeRow}>
                      <Text style={[styles.codeText, { color: colors.text }]}>
                        {promo.code}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: status.color + '20' },
                        ]}
                      >
                        <Text
                          style={{
                            color: status.color,
                            fontSize: 11,
                            fontWeight: '700',
                          }}
                        >
                          {status.label}
                        </Text>
                      </View>
                    </View>
                    {promo.description ? (
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 13,
                          marginTop: 4,
                        }}
                        numberOfLines={1}
                      >
                        {promo.description}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <View style={styles.detail}>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 11,
                      }}
                    >
                      Discount
                    </Text>
                    <Text
                      style={{
                        color: colors.secondary,
                        fontSize: 15,
                        fontWeight: '700',
                      }}
                    >
                      {formatDiscount(promo)}
                    </Text>
                  </View>
                  <View style={styles.detail}>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 11,
                      }}
                    >
                      Usage
                    </Text>
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 15,
                        fontWeight: '700',
                      }}
                    >
                      {promo.usage_count}
                      {promo.usage_limit !== null
                        ? ` / ${promo.usage_limit}`
                        : ''}
                    </Text>
                  </View>
                  <View style={styles.detail}>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 11,
                      }}
                    >
                      Min Order
                    </Text>
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 15,
                        fontWeight: '700',
                      }}
                    >
                      {promo.min_order_amount > 0
                        ? `\u20A6${promo.min_order_amount.toLocaleString()}`
                        : 'None'}
                    </Text>
                  </View>
                </View>

                <View style={styles.promoActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: colors.border }]}
                    onPress={() => toggleActive(promo)}
                  >
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 13,
                      }}
                    >
                      {promo.is_active ? 'Deactivate' : 'Activate'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: colors.border }]}
                    onPress={() => openEditForm(promo)}
                  >
                    <Pencil size={14} color={colors.secondary} />
                    <Text
                      style={{
                        color: colors.secondary,
                        fontSize: 13,
                        marginLeft: 4,
                      }}
                    >
                      Edit
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#ef444440' }]}
                    onPress={() => handleDelete(promo)}
                  >
                    <Trash2 size={14} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heading: { fontSize: 22, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  formCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: { fontSize: 18, fontWeight: '700' },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  saveBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  promoCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  promoTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  codeText: { fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb20',
  },
  detail: { flex: 1, gap: 4 },
  promoActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb20',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
});
