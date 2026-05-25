/**
 * DepoScreen — Professional UI rewrite
 * Logic unchanged: depot list → check-in/check-out (inline view instead of Modal)
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import {
  displaySegmentsDEPO,
  checkInFromOneAppForDepo,
  checkOutFromOneAppDepot,
  validateDepoCheckInToday,
  erroLogCreate,
} from '../api/api';
import { useAuth } from '../context/AuthContext';
import { getOrCreateDeviceId, getDeviceName } from '../utils/deviceId';
import { MaterialIcons } from '@expo/vector-icons';

const ACCENT = '#BF360C';
const LIGHT  = '#FBE9E7';

// Formats a date/time string to "17 Apr 2026, 09:45 AM"
function formatDateTime(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

// Status badge config
function getStatusConfig(status) {
  switch (status) {
    case 'checked_in':
      return { label: 'Checked In', bg: '#E8F5E9', color: '#2E7D32', icon: 'check-circle' };
    case 'day_complete':
      return { label: 'Day Complete', bg: '#E3F2FD', color: '#1565C0', icon: 'verified' };
    default:
      return { label: 'Can Check In', bg: '#F5F5F5', color: '#616161', icon: 'radio-button-unchecked' };
  }
}

export default function DepoScreen() {
  const { userId } = useAuth();
  const [depots, setDepots]     = useState([]);
  const [loading, setLoading]   = useState(true);

  // View state: 'list' | 'detail'
  const [view, setView]                         = useState('list');
  const [selectedDepot, setSelectedDepot]       = useState(null);
  const [checkInStatus, setCheckInStatus]       = useState('can_check_in');
  const [checkInTime, setCheckInTime]           = useState(null);
  const [checkOutTime, setCheckOutTime]         = useState(null);
  const [locationLoading, setLocationLoading]   = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [statusLoading, setStatusLoading]       = useState(false);

  useEffect(() => { loadDepots(); }, []);

  async function loadDepots() {
    setLoading(true);
    try {
      const result = await displaySegmentsDEPO(userId);
      setDepots(result || []);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectDepot(depot) {
    setSelectedDepot(depot);
    setView('detail');
    setStatusLoading(true);

    const deviceId = depot.RMD_User__r?.Mobile_Id__c;
    setSelectedDeviceId(deviceId !== 'undefined' ? deviceId : null);

    try {
      const res = await validateDepoCheckInToday(depot.RMD_Territory_Master__c);
      setCheckInStatus(res.status || 'can_check_in');
      setCheckInTime(res.checkInTime || null);
      setCheckOutTime(res.checkOutTime || null);
    } catch {
      setCheckInStatus('can_check_in');
      setCheckInTime(null);
      setCheckOutTime(null);
    } finally {
      setStatusLoading(false);
    }
  }

  async function doGeoAction(type) {
    if (checkInStatus === 'day_complete') {
      Toast.show({
        type: 'info',
        text1: "Today's Check-in Complete",
        text2: `Checked in: ${formatDateTime(checkInTime)}`,
      });
      return;
    }

    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }

      const position              = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = position.coords;
      const mobileId              = await getOrCreateDeviceId();
      const deviceName            = getDeviceName();

      if (selectedDeviceId && selectedDeviceId !== mobileId) {
        await erroLogCreate({
          recordId: selectedDepot.RMD_Territory_Master__c,
          userIds: userId, mobId: mobileId, deviceNM: deviceName,
        });
        Toast.show({ type: 'error', text1: 'Error', text2: 'Please check in/out with registered device!' });
        return;
      }

      const payload = {
        lat: latitude, lng: longitude,
        recordId: selectedDepot.RMD_Territory_Master__c,
        recordTypeCheckin: 'DEPO',
        userIds: userId, mobId: mobileId, deviceNM: deviceName,
      };

      if (type === 'checkin') {
        const result = await checkInFromOneAppForDepo(payload);
        if (result.success) {
          setCheckInStatus('checked_in');
          setCheckInTime(new Date().toISOString());
          Toast.show({ type: 'success', text1: 'Check-in Successful!', text2: result.message });
        } else {
          Toast.show({ type: 'error', text1: 'Check-in Failed', text2: result.message });
        }
      } else {
        const result = await checkOutFromOneAppDepot(payload);
        if (result.success) {
          setCheckInStatus('day_complete');
          setCheckOutTime(new Date().toISOString());
          Toast.show({ type: 'success', text1: 'Check-out Successful!', text2: result.message });
        } else {
          Toast.show({ type: 'error', text1: 'Check-out Failed', text2: result.message });
        }
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Location Error', text2: 'Please enable GPS and try again.' });
    } finally {
      setLocationLoading(false);
    }
  }

  function onDayCompletePress() {
    Toast.show({
      type: 'info',
      text1: "Today's Check-in Complete",
      text2: `Date: ${formatDateTime(checkInTime)}`,
      visibilityTime: 4000,
    });
  }

  // ── Loading State ────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={ACCENT} />
        <Text style={s.loadingText}>Loading depots...</Text>
      </View>
    );
  }

  const statusCfg = getStatusConfig(checkInStatus);

  // ── Detail View ──────────────────────────────────────────────────────
  if (view === 'detail') {
    return (
      <View style={s.page}>
        {/* Detail header bar */}
        <View style={[s.detailTopBar, { backgroundColor: ACCENT }]}>
          <TouchableOpacity onPress={() => setView('list')} style={{ marginRight: 12 }}>
            <MaterialIcons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={[s.detailTopIconBox, { backgroundColor: '#ffffff22' }]}>
            <MaterialIcons name="local-shipping" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.detailTopTitle} numberOfLines={1}>
              {selectedDepot?.RMD_Territory_Master__r?.Name || 'Depot Details'}
            </Text>
            <Text style={s.detailTopSubtitle}>
              {selectedDepot?.RMD_Territory_Master__r?.RMD_Branch__r?.Name || ''}
            </Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Status banner */}
          {statusLoading ? (
            <View style={s.statusLoading}>
              <ActivityIndicator size="small" color={ACCENT} />
              <Text style={s.statusLoadingText}>Checking attendance status...</Text>
            </View>
          ) : (
            <View style={[s.statusBanner, { backgroundColor: statusCfg.bg }]}>
              <MaterialIcons name={statusCfg.icon} size={22} color={statusCfg.color} style={{ marginRight: 10 }} />
              <Text style={[s.statusBannerText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
            </View>
          )}

          {/* Attendance card (shown when check-in time exists) */}
          {(checkInTime || checkOutTime) && (
            <View style={s.infoCard}>
              <View style={[s.infoCardHeader, { backgroundColor: ACCENT }]}>
                <MaterialIcons name="schedule" size={13} color="#fff" style={{ marginRight: 5 }} />
                <Text style={s.infoCardHeaderText}>TODAY'S ATTENDANCE</Text>
              </View>
              {checkInTime  && <InfoRow label="Check-In Time"  value={formatDateTime(checkInTime)} />}
              {checkOutTime && <InfoRow label="Check-Out Time" value={formatDateTime(checkOutTime)} />}
            </View>
          )}

          {/* Depot info card */}
          <View style={s.infoCard}>
            <View style={[s.infoCardHeader, { backgroundColor: ACCENT }]}>
              <MaterialIcons name="local-shipping" size={13} color="#fff" style={{ marginRight: 5 }} />
              <Text style={s.infoCardHeaderText}>DEPOT INFORMATION</Text>
            </View>
            <InfoRow label="Depot Name"     value={selectedDepot?.RMD_Territory_Master__r?.Name} />
            <InfoRow label="SAP Code"       value={selectedDepot?.RMD_Territory_Master__r?.RMD_SAP_Code__c} />
            <InfoRow label="Territory Type" value={selectedDepot?.RMD_Territory_Master__r?.RMD_Territory_Type__c} />
            <InfoRow label="Branch"         value={selectedDepot?.RMD_Territory_Master__r?.RMD_Branch__r?.Name} />
          </View>

          {/* Action buttons */}
          <View style={s.actionArea}>
            {checkInStatus === 'day_complete' ? (
              <TouchableOpacity style={s.dayCompleteBtn} onPress={onDayCompletePress}>
                <MaterialIcons name="verified" size={22} color="#1565C0" style={{ marginRight: 10 }} />
                <View>
                  <Text style={s.dayCompleteBtnText}>Today's Visit Complete</Text>
                  {!!checkInTime && <Text style={s.dayCompleteBtnSub}>{formatDateTime(checkInTime)}</Text>}
                </View>
              </TouchableOpacity>
            ) : (
              <>
                {checkInStatus === 'can_check_in' && (
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: ACCENT }]}
                    onPress={() => doGeoAction('checkin')}
                    disabled={locationLoading || statusLoading}
                  >
                    {locationLoading
                      ? <ActivityIndicator color="#fff" />
                      : (
                        <>
                          <MaterialIcons name="my-location" size={20} color="#fff" style={{ marginRight: 10 }} />
                          <Text style={s.actionBtnText}>Check In</Text>
                        </>
                      )}
                  </TouchableOpacity>
                )}
                {checkInStatus === 'checked_in' && (
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: '#C62828' }]}
                    onPress={() => doGeoAction('checkout')}
                    disabled={locationLoading || statusLoading}
                  >
                    {locationLoading
                      ? <ActivityIndicator color="#fff" />
                      : (
                        <>
                          <MaterialIcons name="logout" size={20} color="#fff" style={{ marginRight: 10 }} />
                          <Text style={s.actionBtnText}>Check Out</Text>
                        </>
                      )}
                  </TouchableOpacity>
                )}
              </>
            )}

            <TouchableOpacity style={s.backBtn} onPress={() => setView('list')}>
              <MaterialIcons name="arrow-back" size={18} color="#444" style={{ marginRight: 8 }} />
              <Text style={s.backBtnText}>Back to Depots</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── List View ────────────────────────────────────────────────────────
  return (
    <View style={s.page}>
      {/* White header row — no search input, just title + count */}
      <View style={s.listHeader}>
        <View style={[s.listHeaderIconBox, { backgroundColor: LIGHT }]}>
          <MaterialIcons name="local-shipping" size={20} color={ACCENT} />
        </View>
        <Text style={s.listHeaderTitle}>My Depots</Text>
        {depots.length > 0 && (
          <View style={[s.countBadge, { backgroundColor: ACCENT }]}>
            <Text style={s.countBadgeText}>{depots.length}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={depots}
        keyExtractor={(item) => item.RMD_Territory_Master__c}
        contentContainerStyle={s.listContent}
        renderItem={({ item }) => {
          // We can't know the per-card status without fetching — show generic arrow
          return (
            <TouchableOpacity
              style={[s.card, { borderLeftColor: ACCENT }]}
              onPress={() => handleSelectDepot(item)}
              activeOpacity={0.8}
            >
              <View style={s.cardTop}>
                <View style={[s.cardIconBox, { backgroundColor: LIGHT }]}>
                  <MaterialIcons name="local-shipping" size={22} color={ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardName} numberOfLines={1}>
                    {item.RMD_Territory_Master__r?.Name || '—'}
                  </Text>
                  <Text style={s.cardSub} numberOfLines={1}>
                    {item.RMD_Territory_Master__r?.RMD_Branch__r?.Name || ''}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color="#c8d0da" />
              </View>
              <View style={s.cardMeta}>
                {!!item.RMD_Territory_Master__r?.RMD_SAP_Code__c && (
                  <View style={s.metaChip}>
                    <MaterialIcons name="qr-code" size={11} color="#9aa5b4" style={{ marginRight: 4 }} />
                    <Text style={s.metaChipText}>SAP: {item.RMD_Territory_Master__r.RMD_SAP_Code__c}</Text>
                  </View>
                )}
                {!!item.RMD_Territory_Master__r?.RMD_Territory_Type__c && (
                  <View style={s.metaChip}>
                    <MaterialIcons name="label-outline" size={11} color="#9aa5b4" style={{ marginRight: 4 }} />
                    <Text style={s.metaChipText}>{item.RMD_Territory_Master__r.RMD_Territory_Type__c}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <View style={[s.emptyIconBox, { backgroundColor: LIGHT }]}>
              <MaterialIcons name="local-shipping" size={44} color={ACCENT} />
            </View>
            <Text style={s.emptyTitle}>No Depots Assigned</Text>
            <Text style={s.emptyHint}>No depot records are assigned to your account</Text>
          </View>
        }
      />
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value || '—'}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  page:              { flex: 1, backgroundColor: '#f0f3f8' },
  loadingContainer:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f3f8' },
  loadingText:       { marginTop: 12, fontSize: 14, color: '#9aa5b4' },

  // List header — white, flush, no floating card
  listHeader:        { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e4e9f0', gap: 10 },
  listHeaderIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  listHeaderTitle:   { flex: 1, fontSize: 16, fontWeight: '700', color: '#16325c' },
  countBadge:        { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  countBadgeText:    { color: '#fff', fontWeight: '700', fontSize: 13 },

  // List content
  listContent:       { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 32 },

  // Cards
  card:              { backgroundColor: '#fff', borderRadius: 10, marginBottom: 10, borderLeftWidth: 5, padding: 14, elevation: 2, shadowColor: '#1a2340', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  cardTop:           { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIconBox:       { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardName:          { fontSize: 14, fontWeight: '700', color: '#16325c', lineHeight: 20 },
  cardSub:           { fontSize: 12, color: '#9aa5b4', marginTop: 2 },
  cardMeta:          { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 },
  metaChip:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f6fa', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  metaChipText:      { fontSize: 11, color: '#9aa5b4', fontWeight: '500' },

  // Empty state
  emptyState:        { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyIconBox:      { width: 88, height: 88, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:        { fontSize: 17, fontWeight: '700', color: '#2d3a4a', marginBottom: 6 },
  emptyHint:         { fontSize: 13, color: '#9aa5b4', textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },

  // Detail top bar
  detailTopBar:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14 },
  detailTopIconBox:  { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  detailTopTitle:    { fontSize: 15, fontWeight: '700', color: '#fff' },
  detailTopSubtitle: { fontSize: 12, color: '#ffffff99', marginTop: 1 },

  // Status
  statusLoading:     { flexDirection: 'row', alignItems: 'center', margin: 12, padding: 14, backgroundColor: '#fff', borderRadius: 10, elevation: 1 },
  statusLoadingText: { marginLeft: 10, fontSize: 13, color: '#9aa5b4' },
  statusBanner:      { flexDirection: 'row', alignItems: 'center', margin: 12, padding: 14, borderRadius: 10 },
  statusBannerText:  { fontSize: 14, fontWeight: '700' },

  // Info card
  infoCard:          { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 10, borderRadius: 10, overflow: 'hidden', elevation: 1, shadowColor: '#1a2340', shadowOpacity: 0.05, shadowRadius: 4 },
  infoCardHeader:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9 },
  infoCardHeaderText:{ fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.6 },
  infoRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f3f8' },
  infoLabel:         { fontSize: 12, color: '#9aa5b4', fontWeight: '500', flex: 1 },
  infoValue:         { fontSize: 13, fontWeight: '600', color: '#16325c', flex: 2, textAlign: 'right' },

  // Action area
  actionArea:        { marginHorizontal: 12, marginTop: 4, marginBottom: 40, gap: 10 },
  actionBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10, paddingVertical: 16, elevation: 2, shadowColor: '#1a2340', shadowOpacity: 0.12, shadowRadius: 6 },
  actionBtnText:     { color: '#fff', fontWeight: '700', fontSize: 15 },
  dayCompleteBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E3F2FD', borderRadius: 10, paddingVertical: 16, paddingHorizontal: 20, borderWidth: 1.5, borderColor: '#1565C0' },
  dayCompleteBtnText:{ fontSize: 14, fontWeight: '700', color: '#1565C0' },
  dayCompleteBtnSub: { fontSize: 11, color: '#1976D2', marginTop: 2, textAlign: 'center' },
  backBtn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10, paddingVertical: 14, borderWidth: 1, borderColor: '#dde3ec', backgroundColor: '#fff' },
  backBtnText:       { fontSize: 14, fontWeight: '600', color: '#444' },
});
