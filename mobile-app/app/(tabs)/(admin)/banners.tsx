import { useTheme } from '@/hooks/useTheme';
import { BannerInput, BannerService } from '@/services/banners';
import { useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import {
  ArrowLeft,
  Eye,
  MousePointer,
  Pencil,
  Plus,
  Trash2,
  X
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  action_type: 'product' | 'vendor' | 'category' | 'url';
  action_id: string | null;
  action_url: string | null;
  is_active: boolean;
  display_order: number;
  start_date: string;
  end_date: string | null;
  clicks: number;
  impressions: number;
}

const EMPTY_FORM: BannerInput = {
  title: '',
  subtitle: '',
  image_url: '',
  action_type: 'category',
  action_id: '',
  action_url: '',
  is_active: true,
  display_order: 0,
  start_date: new Date().toISOString(),
  end_date: null,
};

const ACTION_TYPES: { label: string; value: Banner['action_type'] }[] = [
  { label: 'Category', value: 'category' },
  { label: 'Product', value: 'product' },
  { label: 'Vendor', value: 'vendor' },
  { label: 'URL', value: 'url' },
];

export default function BannersManagement() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerInput>(EMPTY_FORM);

  const fetchBanners = async () => {
    try {
      const data = await BannerService.getAllBanners();
      setBanners(data);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBanners();
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBanners();
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      display_order: banners.length,
      start_date: new Date().toISOString(),
    });
    setShowForm(true);
  };

  const openEditForm = (banner: Banner) => {
    setEditingId(banner.id);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle,
      image_url: banner.image_url,
      action_type: banner.action_type,
      action_id: banner.action_id,
      action_url: banner.action_url,
      is_active: banner.is_active,
      display_order: banner.display_order,
      start_date: banner.start_date,
      end_date: banner.end_date,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert('Validation', 'Title is required.');
      return;
    }
    if (!form.image_url.trim()) {
      Alert.alert('Validation', 'Image URL is required.');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await BannerService.updateBanner(editingId, form);
      } else {
        await BannerService.createBanner(form);
      }
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      closeForm();
      fetchBanners();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save banner.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (banner: Banner) => {
    Alert.alert(
      'Delete Banner',
      `Delete "${banner.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await BannerService.deleteBanner(banner.id);
              queryClient.invalidateQueries({ queryKey: ['banners'] });
              fetchBanners();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete.');
            }
          },
        },
      ],
    );
  };

  const toggleActive = async (banner: Banner) => {
    try {
      await BannerService.updateBanner(banner.id, {
        is_active: !banner.is_active,
      });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      fetchBanners();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update.');
    }
  };

  const getBannerStatus = (banner: Banner) => {
    const now = new Date();
    const start = new Date(banner.start_date);
    const end = banner.end_date ? new Date(banner.end_date) : null;

    if (!banner.is_active) return { label: 'Inactive', color: '#6b7280' };
    if (start > now) return { label: 'Scheduled', color: '#f59e0b' };
    if (end && end < now) return { label: 'Expired', color: '#ef4444' };
    return { label: 'Active', color: '#10b981' };
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
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.headerContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: colors.filter,
            width: 40,
            height: 40,
            borderRadius: 20,
            padding: 8,
            elevation: 3,
            shadowColor: colors.text,
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.header, { color: colors.text }]}>Banner Management</Text>
      </View>
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
            Banners ({banners.length})
          </Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.secondary }]}
            onPress={openCreateForm}
          >
            <Plus size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Create / Edit Form */}
        {showForm && (
          <View
            style={[
              styles.formCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: colors.text }]}>
                {editingId ? 'Edit Banner' : 'New Banner'}
              </Text>
              <TouchableOpacity onPress={closeForm}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Title *
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
              value={form.title}
              onChangeText={(v) => setForm({ ...form, title: v })}
              placeholder="Banner title"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Subtitle
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
              value={form.subtitle || ''}
              onChangeText={(v) => setForm({ ...form, subtitle: v || null })}
              placeholder="Optional subtitle"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Image URL *
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
              value={form.image_url}
              onChangeText={(v) => setForm({ ...form, image_url: v })}
              placeholder="https://..."
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />

            {form.image_url ? (
              <Image
                source={{ uri: form.image_url }}
                style={styles.preview}
                resizeMode="cover"
              />
            ) : null}

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Action Type
            </Text>
            <View style={styles.chipRow}>
              {ACTION_TYPES.map((at) => (
                <TouchableOpacity
                  key={at.value}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        form.action_type === at.value
                          ? colors.secondary
                          : colors.input,
                      borderColor:
                        form.action_type === at.value
                          ? colors.secondary
                          : colors.inputBorder,
                    },
                  ]}
                  onPress={() => setForm({ ...form, action_type: at.value })}
                >
                  <Text
                    style={{
                      color:
                        form.action_type === at.value ? '#fff' : colors.text,
                      fontSize: 13,
                      fontWeight: '600',
                    }}
                  >
                    {at.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {form.action_type === 'url' ? (
              <>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Action URL
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
                  value={form.action_url || ''}
                  onChangeText={(v) =>
                    setForm({ ...form, action_url: v || null })
                  }
                  placeholder="https://..."
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                />
              </>
            ) : (
              <>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Action ID ({form.action_type})
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
                  value={form.action_id || ''}
                  onChangeText={(v) =>
                    setForm({ ...form, action_id: v || null })
                  }
                  placeholder={
                    form.action_type === 'category' ? 'e.g. Vegetable' : 'UUID'
                  }
                  placeholderTextColor={colors.textSecondary}
                />
              </>
            )}

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Display Order
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
                  value={String(form.display_order)}
                  onChangeText={(v) =>
                    setForm({
                      ...form,
                      display_order: parseInt(v) || 0,
                    })
                  }
                  keyboardType="number-pad"
                />
              </View>
              <View
                style={{
                  flex: 1,
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
                  {editingId ? 'Update Banner' : 'Create Banner'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Banner List */}
        {banners.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ color: colors.textSecondary, fontSize: 15 }}>
              No banners yet. Add one to get started.
            </Text>
          </View>
        ) : (
          banners.map((banner) => {
            const status = getBannerStatus(banner);
            return (
              <View
                key={banner.id}
                style={[
                  styles.bannerCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.bannerTop}>
                  {banner.image_url ? (
                    <Image
                      source={{ uri: banner.image_url }}
                      style={styles.thumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[styles.thumb, { backgroundColor: colors.border }]}
                    />
                  )}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      style={[styles.bannerTitle, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {banner.title}
                    </Text>
                    {banner.subtitle ? (
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 13,
                          marginTop: 2,
                        }}
                        numberOfLines={1}
                      >
                        {banner.subtitle}
                      </Text>
                    ) : null}
                    <View style={styles.statsRow}>
                      <View style={styles.stat}>
                        <Eye size={13} color={colors.textSecondary} />
                        <Text
                          style={{
                            color: colors.textSecondary,
                            fontSize: 12,
                            marginLeft: 4,
                          }}
                        >
                          {banner.impressions}
                        </Text>
                      </View>
                      <View style={styles.stat}>
                        <MousePointer size={13} color={colors.textSecondary} />
                        <Text
                          style={{
                            color: colors.textSecondary,
                            fontSize: 12,
                            marginLeft: 4,
                          }}
                        >
                          {banner.clicks}
                        </Text>
                      </View>
                    </View>
                  </View>
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

                <View style={styles.bannerActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: colors.border }]}
                    onPress={() => toggleActive(banner)}
                  >
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                      {banner.is_active ? 'Deactivate' : 'Activate'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: colors.border }]}
                    onPress={() => openEditForm(banner)}
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
                    onPress={() => handleDelete(banner)}
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: '700',
  },
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
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  preview: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginTop: 10,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  saveBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  bannerCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  bannerTop: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 64, height: 64, borderRadius: 10 },
  bannerTitle: { fontSize: 16, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  stat: { flexDirection: 'row', alignItems: 'center' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bannerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb20',
    paddingTop: 12,
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
