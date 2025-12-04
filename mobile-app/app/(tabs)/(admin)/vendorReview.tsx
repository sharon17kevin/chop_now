import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/useUserStore';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock,
  MapPin,
  Phone,
  Store,
  X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface VendorApplication {
  id: string;
  user_id: string;
  farm_name: string;
  farm_location: string | null;
  farm_description: string;
  business_phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string | null;
  delivery_zones: string[];
  business_hours: any;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export default function VendorReview() {
  const { colors } = useTheme();
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);

  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedApp, setSelectedApp] = useState<VendorApplication | null>(
    null
  );
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (profile?.role !== 'admin') {
      Alert.alert('Access Denied', 'Only admins can access this page.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [profile, router]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      console.log('Fetching vendor applications...');

      const { data, error } = await supabase
        .from('vendor_applications')
        .select(
          `
          *,
          profiles:user_id(full_name, email)
        `
        )
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Applications fetched:', data?.length || 0);
      setApplications(data || []);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      Alert.alert('Error', 'Failed to load applications: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  const handleApprove = async (application: VendorApplication) => {
    Alert.alert(
      'Approve Application',
      `Are you sure you want to approve ${application.farm_name}? This will upgrade the user to a vendor account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              setProcessing(true);

              const { error } = await supabase.rpc(
                'approve_vendor_application',
                {
                  application_id: application.id,
                  admin_id: profile?.id,
                }
              );

              if (error) throw error;

              Alert.alert('Success', 'Vendor application approved!');
              fetchApplications(); // Refresh list
              setSelectedApp(null);
            } catch (error: any) {
              console.error('Error approving application:', error);
              Alert.alert('Error', error.message || 'Failed to approve');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Required', 'Please provide a rejection reason');
      return;
    }

    if (!selectedApp) return;

    try {
      setProcessing(true);

      const { error } = await supabase.rpc('reject_vendor_application', {
        application_id: selectedApp.id,
        admin_id: profile?.id,
        rejection_reason: rejectionReason,
      });

      if (error) throw error;

      Alert.alert('Application Rejected', 'User has been notified.');
      setShowRejectModal(false);
      setRejectionReason('');
      fetchApplications();
      setSelectedApp(null);
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      Alert.alert('Error', error.message || 'Failed to reject');
    } finally {
      setProcessing(false);
    }
  };

  const renderApplicationCard = ({ item }: { item: VendorApplication }) => (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={() => setSelectedApp(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Store size={24} color={colors.secondary} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.farmName, { color: colors.text }]}>
            {item.farm_name}
          </Text>
          <Text style={[styles.applicantName, { color: colors.textSecondary }]}>
            {item.profiles?.full_name || 'Unknown'}
          </Text>
        </View>
        <View
          style={[styles.badge, { backgroundColor: colors.secondary + '20' }]}
        >
          <Clock size={14} color={colors.secondary} />
          <Text style={[styles.badgeText, { color: colors.secondary }]}>
            Pending
          </Text>
        </View>
      </View>

      <View style={styles.cardInfo}>
        <MapPin size={16} color={colors.textTetiary} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          {item.city}, {item.state}
        </Text>
      </View>

      <View style={styles.cardInfo}>
        <Phone size={16} color={colors.textTetiary} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          {item.business_phone}
        </Text>
      </View>

      <Text style={[styles.dateText, { color: colors.textTetiary }]}>
        Applied {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading applications...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Detail view
  if (selectedApp) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View
          style={[
            styles.header,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity
            onPress={() => setSelectedApp(null)}
            style={[styles.backButton, { backgroundColor: colors.filter }]}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Application Details
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.detailContent}>
          {/* Business Info */}
          <View style={styles.detailSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Business Information
            </Text>
            <View style={styles.detailRow}>
              <Text
                style={[styles.detailLabel, { color: colors.textSecondary }]}
              >
                Business Name:
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {selectedApp.farm_name}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text
                style={[styles.detailLabel, { color: colors.textSecondary }]}
              >
                Description:
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {selectedApp.farm_description}
              </Text>
            </View>
            {selectedApp.farm_location && (
              <View style={styles.detailRow}>
                <Text
                  style={[styles.detailLabel, { color: colors.textSecondary }]}
                >
                  Farm Location:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {selectedApp.farm_location}
                </Text>
              </View>
            )}
          </View>

          {/* Applicant Info */}
          <View style={styles.detailSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Applicant Information
            </Text>
            <View style={styles.detailRow}>
              <Text
                style={[styles.detailLabel, { color: colors.textSecondary }]}
              >
                Name:
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {selectedApp.profiles?.full_name || 'N/A'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text
                style={[styles.detailLabel, { color: colors.textSecondary }]}
              >
                Email:
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {selectedApp.profiles?.email || 'N/A'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text
                style={[styles.detailLabel, { color: colors.textSecondary }]}
              >
                Phone:
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {selectedApp.business_phone}
              </Text>
            </View>
          </View>

          {/* Address Info */}
          <View style={styles.detailSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Address
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {selectedApp.address}
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {selectedApp.city}, {selectedApp.state}
              {selectedApp.postal_code ? ` ${selectedApp.postal_code}` : ''}
            </Text>
          </View>

          {/* Delivery Zones */}
          {selectedApp.delivery_zones &&
            selectedApp.delivery_zones.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Delivery Zones
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {selectedApp.delivery_zones.join(', ')}
                </Text>
              </View>
            )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.approveButton,
                { backgroundColor: '#10b981' },
                processing && { opacity: 0.6 },
              ]}
              onPress={() => handleApprove(selectedApp)}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Check size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Approve</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.rejectButton,
                { backgroundColor: '#ef4444' },
                processing && { opacity: 0.6 },
              ]}
              onPress={() => setShowRejectModal(true)}
              disabled={processing}
            >
              <X size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Rejection Modal */}
        {showRejectModal && (
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalContent, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Reject Application
              </Text>
              <Text
                style={[
                  styles.modalDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Please provide a reason for rejection. The applicant will be
                notified.
              </Text>

              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="e.g., Incomplete business information"
                placeholderTextColor={colors.textTetiary}
                value={rejectionReason}
                onChangeText={setRejectionReason}
                multiline
                numberOfLines={4}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: colors.filter },
                  ]}
                  onPress={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                >
                  <Text
                    style={[styles.modalButtonText, { color: colors.text }]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: '#ef4444' },
                    processing && { opacity: 0.6 },
                  ]}
                  onPress={handleReject}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                      Reject
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // List view
  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.filter }]}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Vendor Applications
          </Text>
        </View>
        <View
          style={[styles.countBadge, { backgroundColor: colors.secondary }]}
        >
          <Text style={styles.countText}>{applications.length}</Text>
        </View>
      </View>

      {applications.length === 0 ? (
        <View style={styles.emptyState}>
          <AlertCircle size={48} color={colors.textTetiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Pending Applications
          </Text>
          <Text
            style={[styles.emptyDescription, { color: colors.textSecondary }]}
          >
            All vendor applications have been reviewed
          </Text>
        </View>
      ) : (
        <FlatList
          data={applications}
          renderItem={renderApplicationCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.secondary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  countBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  farmName: {
    fontSize: 16,
    fontWeight: '700',
  },
  applicantName: {
    fontSize: 14,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  dateText: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  detailContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 40,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  approveButton: {},
  rejectButton: {},
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
