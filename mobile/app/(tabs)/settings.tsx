import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  const { user, apiUrl, updateApiUrl, logout } = useAuth();

  const [editingUrl, setEditingUrl] = useState(apiUrl);
  const [savingUrl, setSavingUrl] = useState(false);
  const [urlSuccess, setUrlSuccess] = useState(false);

  async function handleSaveServerUrl() {
    if (!editingUrl.trim()) return;
    setSavingUrl(true);
    setUrlSuccess(false);

    try {
      await updateApiUrl(editingUrl.trim());
      setUrlSuccess(true);
      setTimeout(() => setUrlSuccess(false), 2500);
    } finally {
      setSavingUrl(false);
    }
  }

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
      {/* Header */}
      <View style={[styles.headerBar, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>الملف الشخصي والإعدادات</Text>
        <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
          إدارة حسابك واتصال السيرفر
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
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

        {/* Server Connection Config Card */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>إعدادات خادم المنصة (API Host)</Text>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.settingHint, { color: theme.textMuted }]}>
            عنوان السيرفر الذي يتصل به التطبيق لجلب وتحديث البيانات:
          </Text>

          <TextInput
            value={editingUrl}
            onChangeText={setEditingUrl}
            placeholder="https://marasil.cloud"
            placeholderTextColor={theme.textSubtle}
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.urlInput,
              {
                backgroundColor: theme.surfaceSoft,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            textAlign="left"
          />

          <View style={styles.saveUrlRow}>
            {urlSuccess ? (
              <View style={styles.successBadge}>
                <MaterialCommunityIcons name="check-circle" size={16} color={theme.success} />
                <Text style={[styles.successText, { color: theme.success }]}>تم الحفظ بنجاح</Text>
              </View>
            ) : <View />}

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.primary }]}
              onPress={() => void handleSaveServerUrl()}
              disabled={savingUrl || !editingUrl.trim()}
            >
              {savingUrl ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.saveBtnText}>حفظ العنوان</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: theme.danger }]}
          onPress={confirmLogout}
        >
          <MaterialCommunityIcons name="logout" size={20} color={theme.danger} />
          <Text style={[styles.logoutBtnText, { color: theme.danger }]}>
            تسجيل الخروج من الحساب
          </Text>
        </TouchableOpacity>

        {/* Footer info */}
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
            الإصدار 1.0.0 (نظام المراقبة والتحكم)
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  settingHint: {
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'right',
  },
  urlInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  saveUrlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  successText: {
    fontSize: 12,
    fontWeight: '700',
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
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
