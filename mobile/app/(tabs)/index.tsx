import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { api, type DeviceItem, type SubscriptionData } from '@/services/api';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const { user } = useAuth();

  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [subRes, devRes] = await Promise.all([
        api.getSubscription(),
        api.getDevices(),
      ]);

      if (subRes.success && subRes.subscription) {
        setSubscription(subRes.subscription);
      }
      if (devRes.success && devRes.devices) {
        setDevices(devRes.devices);
      }
    } catch {
      // Ignore network errors during background refresh
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchData();
  }, [fetchData]);

  const connectedDevicesCount = devices.filter((d) => d.status === 'connected').length;
  const disconnectedDevicesCount = devices.filter((d) => d.status !== 'connected').length;

  // Calculate remaining days
  const remainingDays = subscription?.ends_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.ends_at).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : subscription?.duration_days ?? 30;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.greeting, { color: theme.textMuted }]}>مرحباً بك،</Text>
            <Text style={[styles.userName, { color: theme.text }]}>
              {user?.full_name || user?.company_name || 'مدير الحساب'}
            </Text>
            {user?.tenant?.name ? (
              <Text style={[styles.companyName, { color: theme.primary }]}>
                {user.tenant.name}
              </Text>
            ) : null}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: theme.primaryLight }]}>
            <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
            <Text style={[styles.statusText, { color: theme.primary }]}>السيرفر متصل</Text>
          </View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textMuted }]}>
              جارٍ تحميل مؤشرات المنصة...
            </Text>
          </View>
        ) : (
          <>
            {/* Subscription KPI Card */}
            <View
              style={[
                styles.card,
                styles.kpiCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={[styles.cardLabel, { color: theme.textMuted }]}>
                    خطة الاشتراك الحالية
                  </Text>
                  <Text style={[styles.planTitle, { color: theme.text }]}>
                    {subscription?.plan_name || 'تجريبي - Free Trial'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        subscription?.status === 'active' ? theme.successLight : theme.primaryLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color:
                          subscription?.status === 'active' ? theme.success : theme.primary,
                      },
                    ]}
                  >
                    {subscription?.status === 'active' ? 'نشط ومفعّل' : 'قيد الاستخدام'}
                  </Text>
                </View>
              </View>

              <View style={styles.kpiDivider} />

              {/* Remaining Days & Quota Row */}
              <View style={styles.kpiStatsRow}>
                <View style={styles.kpiStatItem}>
                  <MaterialCommunityIcons
                    name="calendar-clock"
                    size={22}
                    color={theme.accent}
                  />
                  <Text style={[styles.kpiStatValue, { color: theme.text }]}>
                    {remainingDays} يوم
                  </Text>
                  <Text style={[styles.kpiStatLabel, { color: theme.textMuted }]}>
                    المتبقي في الباقة
                  </Text>
                </View>

                <View style={styles.kpiStatItem}>
                  <MaterialCommunityIcons
                    name="cellphone-link"
                    size={22}
                    color={theme.primary}
                  />
                  <Text style={[styles.kpiStatValue, { color: theme.text }]}>
                    {devices.length} / {subscription?.max_devices ?? 1}
                  </Text>
                  <Text style={[styles.kpiStatLabel, { color: theme.textMuted }]}>
                    الأجهزة المستخدمة
                  </Text>
                </View>

                <View style={styles.kpiStatItem}>
                  <MaterialCommunityIcons
                    name="message-text-outline"
                    size={22}
                    color={theme.icon}
                  />
                  <Text style={[styles.kpiStatValue, { color: theme.text }]}>
                    {(subscription?.monthly_message_limit ?? 5000).toLocaleString('en-US')}
                  </Text>
                  <Text style={[styles.kpiStatLabel, { color: theme.textMuted }]}>
                    حد الرسائل / شهر
                  </Text>
                </View>
              </View>
            </View>

            {/* Devices Overview Card */}
            <View
              style={[
                styles.card,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.rowAlign}>
                  <MaterialCommunityIcons
                    name="cellphone-check"
                    size={20}
                    color={theme.primary}
                  />
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    حالة أجهزة الواتساب
                  </Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/(tabs)/devices')}>
                  <Text style={[styles.viewAllLink, { color: theme.primary }]}>
                    إدارة الأجهزة
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.devicesStatsGrid}>
                <View
                  style={[
                    styles.deviceStatBox,
                    { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.deviceStatNumber, { color: theme.success }]}>
                    {connectedDevicesCount}
                  </Text>
                  <Text style={[styles.deviceStatText, { color: theme.textMuted }]}>
                    أجهزة متصلة ونشطة
                  </Text>
                </View>

                <View
                  style={[
                    styles.deviceStatBox,
                    { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.deviceStatNumber,
                      { color: disconnectedDevicesCount > 0 ? theme.danger : theme.textMuted },
                    ]}
                  >
                    {disconnectedDevicesCount}
                  </Text>
                  <Text style={[styles.deviceStatText, { color: theme.textMuted }]}>
                    بحاجة لربط أو مفصولة
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                onPress={() => router.push('/(tabs)/devices')}
              >
                <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#ffffff" />
                <Text style={styles.actionBtnText}>إضافة جهاز جديد</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.actionBtnSecondary,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => router.push('/(tabs)/subscription')}
              >
                <MaterialCommunityIcons name="shield-star-outline" size={20} color={theme.accent} />
                <Text style={[styles.actionBtnTextSecondary, { color: theme.text }]}>
                  تفاصيل الخطة والرصيد
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 12,
    fontWeight: '600',
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  companyName: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiCard: {
    paddingTop: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  planTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  kpiDivider: {
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    marginVertical: 14,
  },
  kpiStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kpiStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  kpiStatValue: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 6,
  },
  kpiStatLabel: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  devicesStatsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  deviceStatBox: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  deviceStatNumber: {
    fontSize: 22,
    fontWeight: '900',
  },
  deviceStatText: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'column',
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  actionBtnSecondary: {
    borderWidth: 1,
  },
  actionBtnTextSecondary: {
    fontSize: 14,
    fontWeight: '700',
  },
});
