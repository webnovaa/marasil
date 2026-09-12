import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { useAuth } from '@/context/auth-context';
import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const { login, apiUrl, isAuthenticated } = useAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [serverUrl, setServerUrl] = useState(apiUrl);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  async function handleLogin() {
    if (!phone.trim() || !password.trim()) {
      setErrorMessage('يرجى إدخال رقم الهاتف وكلمة المرور');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await login(phone.trim(), password, serverUrl.trim());
      if (res.success) {
        router.replace('/(tabs)');
      } else {
        setErrorMessage(res.error || 'تعذر تسجيل الدخول، تأكد من صحة البيانات.');
      }
    } catch {
      setErrorMessage('حدث خطأ غير متوقع أثناء تسجيل الدخول.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Header */}
          <View style={styles.header}>
            <View style={[styles.logoBadge, { backgroundColor: theme.primaryLight }]}>
              <MaterialCommunityIcons name="whatsapp" size={44} color={theme.primary} />
            </View>
            <Text style={[styles.brandTitle, { color: theme.text }]}>{Brand.name}</Text>
            <Text style={[styles.brandSubtitle, { color: theme.primary }]}>
              WhatsApp API SaaS
            </Text>
            <Text style={[styles.tagline, { color: theme.textMuted }]}>
              تطبيق المراقبة وإدارة الأجهزة والاشتراك
            </Text>
          </View>

          {/* Form Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            {errorMessage ? (
              <View style={[styles.errorBox, { backgroundColor: theme.dangerLight }]}>
                <MaterialCommunityIcons name="alert-circle" size={18} color={theme.danger} />
                <Text style={[styles.errorText, { color: theme.danger }]}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>رقم الهاتف المسجل</Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
                ]}
              >
                <MaterialCommunityIcons
                  name="phone-outline"
                  size={20}
                  color={theme.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+9639xxxxxxxx أو 966xxxxxxxxx"
                  placeholderTextColor={theme.textSubtle}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  style={[styles.input, { color: theme.text }]}
                  textAlign="left"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>كلمة المرور</Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
                ]}
              >
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={20}
                  color={theme.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="كلمة مرور حسابك"
                  placeholderTextColor={theme.textSubtle}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={[styles.input, { color: theme.text }]}
                  textAlign="left"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.icon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Server URL Config Accordion */}
            <TouchableOpacity
              onPress={() => setShowServerConfig(!showServerConfig)}
              style={styles.serverToggle}
            >
              <Text style={[styles.serverToggleText, { color: theme.textMuted }]}>
                {showServerConfig ? 'إخفاء إعدادات السيرفر' : 'إعدادات عنوان السيرفر (API Host)'}
              </Text>
              <MaterialCommunityIcons
                name={showServerConfig ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={theme.textMuted}
              />
            </TouchableOpacity>

            {showServerConfig ? (
              <View style={styles.serverConfigBox}>
                <Text style={[styles.serverHint, { color: theme.textSubtle }]}>
                  عنوان خادم المنصة (مثال: https://marasil.cloud أو دومين سيرفرك)
                </Text>
                <TextInput
                  value={serverUrl}
                  onChangeText={setServerUrl}
                  placeholder="https://marasil.cloud"
                  placeholderTextColor={theme.textSubtle}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.serverInput,
                    {
                      backgroundColor: theme.surfaceSoft,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  textAlign="left"
                />
              </View>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              onPress={() => void handleLogin()}
              disabled={loading}
              style={[
                styles.submitBtn,
                { backgroundColor: theme.primary },
                loading && styles.submitBtnDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <View style={styles.submitBtnContent}>
                  <Text style={styles.submitBtnText}>تسجيل الدخول للمنصة</Text>
                  <MaterialCommunityIcons name="arrow-left" size={20} color="#ffffff" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'right',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  eyeBtn: {
    padding: 6,
  },
  serverToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    marginBottom: 8,
  },
  serverToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  serverConfigBox: {
    marginBottom: 16,
  },
  serverHint: {
    fontSize: 11,
    marginBottom: 6,
    textAlign: 'right',
  },
  serverInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  submitBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
