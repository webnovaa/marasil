import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, type DeviceItem } from '@/services/api';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function DevicesScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];

  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add Device Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Quick Send Modal State
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendTargetDevice, setSendTargetDevice] = useState<DeviceItem | null>(null);
  const [sendRecipient, setSendRecipient] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCheckingNum, setIsCheckingNum] = useState(false);
  const [checkNumResult, setCheckNumResult] = useState<string | null>(null);

  // Action in progress (disconnecting/deleting ID)
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await api.getDevices();
      if (res.success && res.devices) {
        setDevices(res.devices);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchDevices();
  }, [fetchDevices]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchDevices();
  }, [fetchDevices]);

  async function handleAddDevice() {
    if (!newDeviceName.trim()) {
      setAddError('يرجى إدخال اسم للجهاز');
      return;
    }

    setSubmittingAdd(true);
    setAddError(null);

    try {
      const res = await api.createDevice(newDeviceName.trim());
      if (res.success && res.device) {
        setDevices((prev) => [res.device!, ...prev]);
        setIsAddModalOpen(false);
        setNewDeviceName('');
      } else {
        setAddError(res.error || 'تعذر إضافة الجهاز، تحقق من حد الأجهزة في باقتك.');
      }
    } catch {
      setAddError('حدث خطأ أثناء إضافة الجهاز.');
    } finally {
      setSubmittingAdd(false);
    }
  }

  function confirmDeleteDevice(device: DeviceItem) {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`هل أنت متأكد من حذف الجهاز "${device.name}"؟`);
      if (confirmed) {
        void executeDeleteDevice(device.id);
      }
      return;
    }

    Alert.alert(
      'تأكيد حذف الجهاز',
      `هل أنت متأكد من رغبتك بحذف الجهاز "${device.name}"؟ سيتم إلغاء الجلسة وإيقاف الربط.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم، احذف',
          style: 'destructive',
          onPress: () => void executeDeleteDevice(device.id),
        },
      ]
    );
  }

  async function executeDeleteDevice(deviceUlid: string) {
    setActionBusyId(deviceUlid);
    try {
      const res = await api.deleteDevice(deviceUlid);
      if (res.success) {
        setDevices((prev) => prev.filter((d) => d.id !== deviceUlid));
      } else {
        Alert.alert('خطأ', res.error || 'تعذر حذف الجهاز.');
      }
    } catch {
      Alert.alert('خطأ', 'حدث خطأ أثناء الاتصال بالسيرفر.');
    } finally {
      setActionBusyId(null);
    }
  }

  async function handleDisconnectDevice(deviceUlid: string) {
    setActionBusyId(deviceUlid);
    try {
      const res = await api.disconnectDevice(deviceUlid);
      if (res.success) {
        setDevices((prev) =>
          prev.map((d) => (d.id === deviceUlid ? { ...d, status: 'disconnected' } : d))
        );
      } else {
        Alert.alert('تنبيه', res.error || 'تعذر فصل الجهاز.');
      }
    } catch {
      Alert.alert('خطأ', 'حدث خطأ أثناء الاتصال بالسيرفر.');
    } finally {
      setActionBusyId(null);
    }
  }

  const handleCheckNumber = async () => {
    if (!sendTargetDevice || !sendRecipient) return;
    setIsCheckingNum(true);
    setCheckNumResult(null);
    try {
      const res = await api.checkNumber(sendTargetDevice.id, sendRecipient.trim());
      if (res.success && res.exists) {
        setCheckNumResult('✅ الرقم مسجل في واتساب');
      } else {
        setCheckNumResult('❌ الرقم غير مسجل في واتساب');
      }
    } catch {
      setCheckNumResult('⚠️ تعذر فحص الرقم');
    } finally {
      setIsCheckingNum(false);
    }
  };

  const handleSendQuickMessage = async () => {
    if (!sendTargetDevice || !sendRecipient || !sendMessage) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم المستلم ونص الرسالة');
      return;
    }
    setIsSending(true);
    try {
      const res = await api.sendQuickMessage(
        sendTargetDevice.id,
        sendRecipient.trim(),
        sendMessage.trim()
      );
      if (res.success) {
        Alert.alert('تم الإرسال بنجاح', 'تم إرسال الرسالة إلى العميل بنجاح');
        setIsSendModalOpen(false);
        setSendRecipient('');
        setSendMessage('');
        setCheckNumResult(null);
      } else {
        Alert.alert('خطأ في الإرسال', res.error || 'تعذر إرسال الرسالة');
      }
    } catch {
      Alert.alert('خطأ', 'فشل في الاتصال بالخادم');
    } finally {
      setIsSending(false);
    }
  };

  function renderStatusBadge(status: string) {
    switch (status) {
      case 'connected':
        return (
          <View style={[styles.statusBadge, { backgroundColor: theme.successLight }]}>
            <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
            <Text style={[styles.statusBadgeText, { color: theme.success }]}>متصل ونشط</Text>
          </View>
        );
      case 'pairing':
        return (
          <View style={[styles.statusBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <View style={[styles.statusDot, { backgroundColor: theme.accent }]} />
            <Text style={[styles.statusBadgeText, { color: theme.accent }]}>بانتظار مسح QR</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusBadge, { backgroundColor: theme.dangerLight }]}>
            <View style={[styles.statusDot, { backgroundColor: theme.danger }]} />
            <Text style={[styles.statusBadgeText, { color: theme.danger }]}>غير متصل</Text>
          </View>
        );
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>أجهزة الواتساب</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
            إجمالي {devices.length} أجهزة مسجلة
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={() => {
            setAddError(null);
            setIsAddModalOpen(true);
          }}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#ffffff" />
          <Text style={styles.addBtnText}>إضافة جهاز</Text>
        </TouchableOpacity>
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
              جارٍ تحميل قائمة الأجهزة...
            </Text>
          </View>
        ) : devices.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: theme.border }]}>
            <MaterialCommunityIcons name="cellphone-off" size={48} color={theme.textSubtle} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>لا توجد أجهزة مضافة بعد</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
              أضف أول جهاز واتساب لربطه وإرسال الرسائل عبر الـ API.
            </Text>
            <TouchableOpacity
              style={[styles.emptyAddBtn, { backgroundColor: theme.primary }]}
              onPress={() => setIsAddModalOpen(true)}
            >
              <Text style={styles.addBtnText}>+ إضافة أول جهاز الآن</Text>
            </TouchableOpacity>
          </View>
        ) : (
          devices.map((device) => {
            const isBusy = actionBusyId === device.id;

            return (
              <View
                key={device.id}
                style={[
                  styles.deviceCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.deviceHeader}>
                  <View style={styles.deviceTitleRow}>
                    <View style={[styles.deviceIconBox, { backgroundColor: theme.surfaceSoft }]}>
                      <MaterialCommunityIcons
                        name="cellphone"
                        size={22}
                        color={device.status === 'connected' ? theme.success : theme.icon}
                      />
                    </View>
                    <View>
                      <Text style={[styles.deviceName, { color: theme.text }]}>
                        {device.name}
                      </Text>
                      <Text style={[styles.devicePhone, { color: theme.textMuted }]}>
                        {device.phone_e164 ? device.phone_e164 : 'غير مرتبط برقم بعد'}
                      </Text>
                    </View>
                  </View>

                  {renderStatusBadge(device.status)}
                </View>

                <View style={styles.deviceMetaRow}>
                  <View style={styles.metaItem}>
                    <Text style={[styles.metaLabel, { color: theme.textSubtle }]}>المحرك:</Text>
                    <Text style={[styles.metaValue, { color: theme.text }]}>Baileys Multi-Device</Text>
                  </View>

                  {device.last_connected_at ? (
                    <View style={styles.metaItem}>
                      <Text style={[styles.metaLabel, { color: theme.textSubtle }]}>آخر اتصال:</Text>
                      <Text style={[styles.metaValue, { color: theme.text }]}>
                        {new Date(device.last_connected_at).toLocaleDateString('ar-EG')}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Card Actions */}
                <View style={[styles.cardActionsRow, { borderTopColor: theme.border }]}>
                  {device.status === 'connected' ? (
                    <>
                      <TouchableOpacity
                        style={[styles.cardActionBtn, { borderColor: theme.primary, backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}
                        disabled={isBusy}
                        onPress={() => {
                          setSendTargetDevice(device);
                          setSendRecipient('');
                          setSendMessage('');
                          setCheckNumResult(null);
                          setIsSendModalOpen(true);
                        }}
                      >
                        <MaterialCommunityIcons
                          name="send-outline"
                          size={16}
                          color={theme.primary}
                        />
                        <Text style={[styles.cardActionText, { color: theme.primary }]}>
                          إرسال رسالة
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.cardActionBtn, { borderColor: theme.border }]}
                        disabled={isBusy}
                        onPress={() => void handleDisconnectDevice(device.id)}
                      >
                        <MaterialCommunityIcons
                          name="power-standby"
                          size={16}
                          color={theme.accent}
                        />
                        <Text style={[styles.cardActionText, { color: theme.accent }]}>
                          فصل
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : null}

                  <TouchableOpacity
                    style={[styles.cardActionBtn, styles.deleteActionBtn]}
                    disabled={isBusy}
                    onPress={() => confirmDeleteDevice(device)}
                  >
                    {isBusy ? (
                      <ActivityIndicator size="small" color={theme.danger} />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name="trash-can-outline"
                          size={16}
                          color={theme.danger}
                        />
                        <Text style={[styles.cardActionText, { color: theme.danger }]}>
                          حذف الجهاز
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Device Modal */}
      <Modal
        visible={isAddModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>إضافة جهاز واتساب جديد</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color={theme.icon} />
              </TouchableOpacity>
            </View>

            {addError ? (
              <View style={[styles.modalError, { backgroundColor: theme.dangerLight }]}>
                <Text style={[styles.modalErrorText, { color: theme.danger }]}>{addError}</Text>
              </View>
            ) : null}

            <Text style={[styles.modalLabel, { color: theme.text }]}>اسم الجهاز</Text>
            <TextInput
              value={newDeviceName}
              onChangeText={setNewDeviceName}
              placeholder="مثال: مبيعات دمشق أو دعم العملاء"
              placeholderTextColor={theme.textSubtle}
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.surfaceSoft,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              textAlign="right"
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: theme.border }]}
                onPress={() => setIsAddModalOpen(false)}
                disabled={submittingAdd}
              >
                <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]}
                onPress={() => void handleAddDevice()}
                disabled={submittingAdd || !newDeviceName.trim()}
              >
                {submittingAdd ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>إضافة وتجهيز</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Quick Send Message Modal */}
      <Modal
        visible={isSendModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSendModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>إرسال رسالة واتساب</Text>
              <TouchableOpacity onPress={() => setIsSendModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color={theme.icon} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { color: theme.textSubtle }]}>
              الجهاز: {sendTargetDevice?.name} ({sendTargetDevice?.phone_e164 || sendTargetDevice?.id.slice(0, 8)})
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <Text style={[styles.modalLabel, { color: theme.text, marginTop: 0 }]}>رقم المستلم الدولي</Text>
              <TouchableOpacity
                onPress={() => void handleCheckNumber()}
                disabled={isCheckingNum || !sendRecipient}
              >
                <Text style={{ fontSize: 11, color: theme.primary, fontWeight: 'bold' }}>
                  {isCheckingNum ? 'جاري الفحص...' : 'فحص واتساب'}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              value={sendRecipient}
              onChangeText={(t) => {
                setSendRecipient(t);
                setCheckNumResult(null);
              }}
              placeholder="+966500000000"
              placeholderTextColor={theme.textSubtle}
              keyboardType="phone-pad"
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.surfaceSoft,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              textAlign="left"
            />

            {checkNumResult ? (
              <Text style={{ fontSize: 12, marginBottom: 8, color: checkNumResult.startsWith('✅') ? theme.success : theme.danger }}>
                {checkNumResult}
              </Text>
            ) : null}

            <Text style={[styles.modalLabel, { color: theme.text }]}>نص الرسالة (يدعم Spintax)</Text>
            <TextInput
              value={sendMessage}
              onChangeText={setSendMessage}
              placeholder="اكتب رسالتك... مثلا: {مرحبا|أهلا} بك"
              placeholderTextColor={theme.textSubtle}
              multiline
              numberOfLines={4}
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.surfaceSoft,
                  borderColor: theme.border,
                  color: theme.text,
                  height: 90,
                  textAlignVertical: 'top',
                },
              ]}
              textAlign="right"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: theme.border }]}
                onPress={() => setIsSendModalOpen(false)}
                disabled={isSending}
              >
                <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]}
                onPress={() => void handleSendQuickMessage()}
                disabled={isSending || !sendRecipient.trim() || !sendMessage.trim()}
              >
                {isSending ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>إرسال الآن</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#ffffff',
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
  emptyBox: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyAddBtn: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  deviceCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  deviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviceIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '800',
  },
  devicePhone: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deviceMetaRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 14,
  },
  metaItem: {
    flexDirection: 'row',
    gap: 4,
  },
  metaLabel: {
    fontSize: 11,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 14,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  deleteActionBtn: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  cardActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalError: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalErrorText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'right',
  },
  modalInput: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalSubmitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalSubmitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
