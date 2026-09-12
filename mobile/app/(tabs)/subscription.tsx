import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, type SubscriptionData } from '@/services/api';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SubscriptionScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];

  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await api.getSubscription();
      if (res.success && res.subscription) {
        setSubscription(res.subscription);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchSubscription();
  }, [fetchSubscription]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchSubscription();
  }, [fetchSubscription]);

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
      {/* Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>تفاصيل الاشتراك والباقة</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
            مراقبة الرصيد، المدة، وحدود الاستهلاك
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: theme.primaryLight }]}>
          <Text style={[styles.statusText, { color: theme.primary }]}>
            {subscription?.status === 'active' ? 'نشط ومفعّل' : 'تجريبي'}
          </Text>
        </View>
      </View>

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
        {loading && !refreshing ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.centerText, { color: theme.textMuted }]}>
              جارٍ تحميل بيانات الاشتراك...
            </Text>
          </View>
        ) : (
          <>
            {/* Plan Hero Card */}
            <View
              style={[
                styles.planCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.planHeader}>
                <View>
                  <Text style={[styles.planLabel, { color: theme.textMuted }]}>الخطة المعتمدة</Text>
                  <Text style={[styles.planName, { color: theme.text }]}>
                    {subscription?.plan_name || 'خطة تجريبية (Free Trial)'}
                  </Text>
                </View>
                <View style={[styles.crownBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <MaterialCommunityIcons name="crown" size={26} color={theme.accent} />
                </View>
              </View>

              <View style={styles.divider} />

              {/* Dates & Validity */}
              <View style={styles.validityRow}>
                <View style={styles.validityItem}>
                  <Text style={[styles.validityLabel, { color: theme.textSubtle }]}>
                    تاريخ التفعيل:
                  </Text>
                  <Text style={[styles.validityValue, { color: theme.text }]}>
                    {subscription?.starts_at
                      ? new Date(subscription.starts_at).toLocaleDateString('ar-EG')
                      : 'اليوم'}
                  </Text>
                </View>

                <View style={styles.validityItem}>
                  <Text style={[styles.validityLabel, { color: theme.textSubtle }]}>
                    تاريخ الانتهاء:
                  </Text>
                  <Text style={[styles.validityValue, { color: theme.text }]}>
                    {subscription?.ends_at
                      ? new Date(subscription.ends_at).toLocaleDateString('ar-EG')
                      : 'غير محدد'}
                  </Text>
                </View>

                <View style={styles.validityItem}>
                  <Text style={[styles.validityLabel, { color: theme.textSubtle }]}>
                    الأيام المتبقية:
                  </Text>
                  <Text style={[styles.validityValue, { color: theme.primary, fontWeight: '900' }]}>
                    {remainingDays} يوم
                  </Text>
                </View>
              </View>
            </View>

            {/* Quota Limits Grid */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>حدود وقدرات الباقة</Text>

            <View style={styles.grid}>
              <View
                style={[
                  styles.gridCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <MaterialCommunityIcons name="cellphone-link" size={26} color={theme.primary} />
                <Text style={[styles.gridValue, { color: theme.text }]}>
                  {subscription?.max_devices ?? 1} أجهزة
                </Text>
                <Text style={[styles.gridLabel, { color: theme.textMuted }]}>
                  أقصى عدد للأجهزة
                </Text>
              </View>

              <View
                style={[
                  styles.gridCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <MaterialCommunityIcons name="email-fast-outline" size={26} color={theme.accent} />
                <Text style={[styles.gridValue, { color: theme.text }]}>
                  {(subscription?.monthly_message_limit ?? 5000).toLocaleString('en-US')}
                </Text>
                <Text style={[styles.gridLabel, { color: theme.textMuted }]}>
                  رسالة شهرياً
                </Text>
              </View>

              <View
                style={[
                  styles.gridCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <MaterialCommunityIcons name="speedometer" size={26} color={theme.icon} />
                <Text style={[styles.gridValue, { color: theme.text }]}>
                  {(subscription?.daily_message_limit_per_device ?? 500).toLocaleString('en-US')}
                </Text>
                <Text style={[styles.gridLabel, { color: theme.textMuted }]}>
                  حد يومي لكل جهاز
                </Text>
              </View>

              <View
                style={[
                  styles.gridCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <MaterialCommunityIcons name="file-image-outline" size={26} color={theme.success} />
                <Text style={[styles.gridValue, { color: theme.text }]}>
                  حتى 16 ميغابايت
                </Text>
                <Text style={[styles.gridLabel, { color: theme.textMuted }]}>
                  حجم الوسائط والملفات
                </Text>
              </View>
            </View>

            {/* Included Features */}
            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>
              الميزات المتضمنة في حسابك
            </Text>

            <View
              style={[
                styles.featuresCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              {[
                'التحقق المباشر من أرقام الواتساب قبل الإرسال (Live Number Check)',
                'ميزة الصياغات المتعددة الذكية لمنع الحظر (Spintax AI Engine)',
                'إرسال الرسائل الفورية والنصوص الطويلة والوسائط',
                'مفتاح API خاص ومستقل لكل جهاز يربطه المستخدم',
                'طابور معالجة ذكي وفصل تلقائي للأجهزة المتعثرة',
              ].map((feat, idx) => (
                <View key={idx} style={styles.featureItem}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={18}
                    color={theme.primary}
                    style={styles.featureIcon}
                  />
                  <Text style={[styles.featureText, { color: theme.text }]}>{feat}</Text>
                </View>
              ))}
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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centerBox: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    marginTop: 12,
    fontSize: 13,
  },
  planCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  planName: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  crownBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    marginVertical: 16,
  },
  validityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  validityItem: {
    alignItems: 'center',
  },
  validityLabel: {
    fontSize: 11,
  },
  validityValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  gridValue: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 8,
  },
  gridLabel: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  featuresCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  featureIcon: {
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
});
