import React from 'react';
import {
  Alert,
  Platform,
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
import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BrandLogo } from '@/components/BrandLogo';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const { user, logout } = useAuth();

  function confirmLogout() {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('هل أنت متأكد من تسجيل الخروج من التطبيق؟');
      if (confirmed) {
        void executeLogout();
      }
      return;
    }

    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من رغبتك بالخروج من حسابك؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تسجيل الخروج',
        style: 'destructive',
        onPress: () => void executeLogout(),
      },
    ]);
  }

  async function executeLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={[styles.headerBar, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>الملف الشخصي</Text>
        <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
          إدارة حسابك في التطبيق
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.userRow}>
            <View style={[styles.avatarBox, { backgroundColor: theme.primaryLight }]}>
              <MaterialCommunityIcons name="account" size={32} color={theme.primary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: theme.text }]}>
                {user?.full_name || 'مدير الحساب'}
              </Text>
              <Text style={[styles.userPhone, { color: theme.textMuted }]}>
                {user?.phone_e164}
              </Text>
              {user?.tenant?.name ? (
                <Text style={[styles.userTenant, { color: theme.primary }]}>
                  {user.tenant.name} ({user.tenant.slug})
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: theme.danger }]}
          onPress={confirmLogout}
        >
          <MaterialCommunityIcons name="logout" size={20} color={theme.danger} />
          <Text style={[styles.logoutBtnText, { color: theme.danger }]}>
            تسجيل الخروج من الحساب
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <BrandLogo
            width={120}
            tone={colorScheme === 'dark' ? 'white' : 'color'}
            style={{ alignSelf: 'center', marginBottom: 8 }}
          />
          <Text style={[styles.footerText, { color: theme.textSubtle }]}>
            {Brand.fullName}
          </Text>
          <Text style={[styles.footerVersion, { color: theme.textSubtle }]}>
            الإصدار 1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
  },
  userPhone: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  userTenant: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 10,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footerVersion: {
    fontSize: 11,
    marginTop: 2,
  },
});
