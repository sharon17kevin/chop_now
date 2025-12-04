import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/useUserStore';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DashboardStats {
  pendingApplications: number;
  approvedVendors: number;
  rejectedApplications: number;
  totalProducts: number;
  pendingProducts: number;
  totalOrders: number;
  totalUsers: number;
}

export default function AdminDashboard() {
  const { colors } = useTheme();
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);

  const [stats, setStats] = useState<DashboardStats>({
    pendingApplications: 0,
    approvedVendors: 0,
    rejectedApplications: 0,
    totalProducts: 0,
    pendingProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch vendor applications stats
      const { data: applications, error: appError } = await supabase
        .from('vendor_applications')
        .select('status');

      if (appError) throw appError;

      const pending =
        applications?.filter((a) => a.status === 'pending').length || 0;
      const approved =
        applications?.filter((a) => a.status === 'approved').length || 0;
      const rejected =
        applications?.filter((a) => a.status === 'rejected').length || 0;

      // Fetch total products
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (productsError) throw productsError;

      // Fetch pending products
      const { count: pendingProductsCount, error: pendingProductsError } =
        await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

      if (pendingProductsError) throw pendingProductsError;

      // Fetch total orders
      const { count: ordersCount, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      if (ordersError) throw ordersError;

      // Fetch total users
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      setStats({
        pendingApplications: pending,
        approvedVendors: approved,
        rejectedApplications: rejected,
        totalProducts: productsCount || 0,
        pendingProducts: pendingProductsCount || 0,
        totalOrders: ordersCount || 0,
        totalUsers: usersCount || 0,
      });
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardStats();
  };

  const StatCard = ({
    icon: Icon,
    label,
    value,
    color,
    onPress,
  }: {
    icon: any;
    label: string;
    value: number;
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.statCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const ActionCard = ({
    icon: Icon,
    title,
    description,
    color,
    badge,
    onPress,
  }: {
    icon: any;
    title: string;
    description: string;
    color: string;
    badge?: number;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.actionCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.actionHeader}>
          <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
            <Icon size={22} color={color} />
          </View>
          {badge !== undefined && badge > 0 && (
            <View style={[styles.badge, { backgroundColor: color }]}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.actionTitle, { color: colors.text }]}>
          {title}
        </Text>
        <Text
          style={[styles.actionDescription, { color: colors.textSecondary }]}
        >
          {description}
        </Text>
      </View>
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
            Loading dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Admin Dashboard
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            Welcome back, {profile?.full_name || 'Admin'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.secondary}
          />
        }
      >
        {/* Overview Stats */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Overview
        </Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats.totalUsers}
            color="#3b82f6"
          />
          <StatCard
            icon={Store}
            label="Approved Vendors"
            value={stats.approvedVendors}
            color="#10b981"
          />
          <StatCard
            icon={Package}
            label="Total Products"
            value={stats.totalProducts}
            color="#8b5cf6"
          />
          <StatCard
            icon={ShoppingBag}
            label="Total Orders"
            value={stats.totalOrders}
            color="#f59e0b"
          />
        </View>

        {/* Vendor Applications Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Vendor Management
        </Text>
        <View style={styles.applicationsStats}>
          <View style={styles.applicationStat}>
            <Clock size={20} color="#f59e0b" />
            <Text style={[styles.applicationStatValue, { color: colors.text }]}>
              {stats.pendingApplications}
            </Text>
            <Text
              style={[
                styles.applicationStatLabel,
                { color: colors.textSecondary },
              ]}
            >
              Pending
            </Text>
          </View>
          <View style={styles.applicationStat}>
            <CheckCircle size={20} color="#10b981" />
            <Text style={[styles.applicationStatValue, { color: colors.text }]}>
              {stats.approvedVendors}
            </Text>
            <Text
              style={[
                styles.applicationStatLabel,
                { color: colors.textSecondary },
              ]}
            >
              Approved
            </Text>
          </View>
          <View style={styles.applicationStat}>
            <XCircle size={20} color="#ef4444" />
            <Text style={[styles.applicationStatValue, { color: colors.text }]}>
              {stats.rejectedApplications}
            </Text>
            <Text
              style={[
                styles.applicationStatLabel,
                { color: colors.textSecondary },
              ]}
            >
              Rejected
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Quick Actions
        </Text>
        <View style={styles.actionsGrid}>
          <ActionCard
            icon={Clock}
            title="Review Applications"
            description="Review pending vendor applications"
            color="#f59e0b"
            badge={stats.pendingApplications}
            onPress={() => router.push('/(tabs)/(admin)/vendorReview')}
          />
          <ActionCard
            icon={Store}
            title="Manage Vendors"
            description="View and manage all vendors"
            color="#10b981"
            onPress={() => {
              // Navigate to vendors management (to be created)
            }}
          />
          <ActionCard
            icon={Package}
            title="Product Management"
            description="Manage all products on platform"
            color="#8b5cf6"
            onPress={() => {
              // Navigate to products management (to be created)
            }}
          />
          <ActionCard
            icon={AlertCircle}
            title="Review Products"
            description="Review pending product submissions"
            color="#ef4444"
            badge={stats.pendingProducts}
            onPress={() => router.push('/(tabs)/(admin)/productReview')}
          />
          <ActionCard
            icon={TrendingUp}
            title="Analytics"
            description="View platform analytics and insights"
            color="#06b6d4"
            onPress={() => router.push('/(tabs)/(admin)/analysis')}
          />
        </View>

        {/* Alerts Section */}
        {stats.pendingApplications > 0 && (
          <View
            style={[
              styles.alertBox,
              {
                backgroundColor: '#f59e0b' + '20',
                borderColor: '#f59e0b',
              },
            ]}
          >
            <AlertCircle size={24} color="#f59e0b" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.alertTitle, { color: colors.text }]}>
                {stats.pendingApplications} Application
                {stats.pendingApplications > 1 ? 's' : ''} Pending
              </Text>
              <Text
                style={[
                  styles.alertDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Review vendor applications to approve or reject them
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.alertButton, { backgroundColor: '#f59e0b' }]}
              onPress={() => router.push('/(tabs)/(admin)/vendorReview')}
            >
              <Text style={styles.alertButtonText}>Review</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    marginTop: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    textAlign: 'center',
  },
  applicationsStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  applicationStat: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  applicationStatValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  applicationStatLabel: {
    fontSize: 12,
  },
  actionsGrid: {
    gap: 12,
  },
  actionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  alertBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 24,
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  alertButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
