/**
 * CSP Screen — Professional UI rewrite
 * Logic unchanged: search → list → detail → create/update form
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView,
  Platform, Modal,
} from 'react-native';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';
import {
  displaySegmentsCSP,
  createSegmentCSP,
  updateSegmentCSP,
  searchDepots,
  searchLocalities,
  validateSegmentCheckIn,
  checkInSegment,
  checkOutSegment,
} from '../api/api';
import { getOrCreateDeviceId, getDeviceName } from '../utils/deviceId';
import { useAuth } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';

// ── Picklists ────────────────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  '--None--', 'A+', 'A', 'B', 'C', 'D',
  'Corporate', 'Retail', 'Educational', 'Other',
];

const ACCENT = '#1B6B3A';
const LIGHT  = '#E8F5E9';

// ─────────────────────────────────────────────
// Shared helper components
// ─────────────────────────────────────────────
function InfoChip({ icon, label, accent }) {
  return (
    <View style={[ic.wrap, { backgroundColor: accent + '15', borderColor: accent + '35' }]}>
      <MaterialIcons name={icon} size={10} color={accent} style={{ marginRight: 3 }} />
      <Text style={[ic.text, { color: accent }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function SFRow({ L, LV, R, RV }) {
  return (
    <View style={sfr.row}>
      <View style={sfr.cell}>
        <Text style={sfr.lbl}>{L}</Text>
        <Text style={sfr.val}>{LV || '—'}</Text>
      </View>
      {!!R && <View style={[sfr.cell, sfr.right]}>
        <Text style={sfr.lbl}>{R}</Text>
        <Text style={sfr.val}>{RV || '—'}</Text>
      </View>}
    </View>
  );
}

const ic = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginRight: 5, marginBottom: 4, maxWidth: 160 },
  text: { fontSize: 11, fontWeight: '600' },
});

const sfr = StyleSheet.create({
  row:   { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f0f3f8' },
  cell:  { flex: 1, paddingHorizontal: 14, paddingVertical: 11 },
  right: { borderLeftWidth: 1, borderLeftColor: '#f0f3f8' },
  lbl:   { fontSize: 11, color: '#9aa5b4', marginBottom: 3, fontWeight: '500' },
  val:   { fontSize: 13, color: '#16325c', fontWeight: '600' },
});

// ─────────────────────────────────────────────
// Form field components
// ─────────────────────────────────────────────
function DropdownPicker({ label, value, options, onSelect, required }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={f.fieldWrap}>
      <Text style={f.label}>{required ? `* ${label}` : label}</Text>
      <TouchableOpacity style={f.dropdown} onPress={() => setOpen(true)}>
        <Text style={[f.dropdownText, value === '--None--' && { color: '#aaa' }]}>{value || '--None--'}</Text>
        <MaterialIcons name="keyboard-arrow-down" size={18} color="#706e6b" />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={f.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={f.pickerBox}>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={f.pickerItem} onPress={() => { onSelect(item); setOpen(false); }}>
                  <Text style={[f.pickerItemText, item === value && { color: ACCENT, fontWeight: '700' }]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function SearchPicker({ label, placeholder, value, displayValue, onSearch, results, onSelect, required, loading, accent = '#0070d2' }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  async function handleSearch() {
    if (query.length < 2) return;
    await onSearch(query);
    setOpen(true);
  }

  return (
    <View style={f.fieldWrap}>
      <Text style={f.label}>{required ? `* ${label}` : label}</Text>
      {value ? (
        <View style={[f.searchSelected, { borderColor: accent, backgroundColor: accent + '12' }]}>
          <Text style={[f.searchSelectedText, { color: accent }]}>{displayValue}</Text>
          <TouchableOpacity onPress={() => { onSelect(null); setQuery(''); }}>
            <Text style={f.clearBtn}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={f.searchRow}>
          <TextInput
            style={f.searchInput}
            placeholder={placeholder}
            placeholderTextColor="#aaa"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={[f.searchIconBtn, { backgroundColor: accent }]} onPress={handleSearch} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="search" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      )}
      {open && results.length > 0 && (
        <View style={f.searchDropdown}>
          {results.map((r) => (
            <TouchableOpacity key={r.id} style={f.searchDropdownItem}
              onPress={() => { onSelect(r); setOpen(false); setQuery(''); }}>
              <Text style={f.searchDropdownText}>{r.name}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => setOpen(false)}>
            <Text style={[f.searchDropdownText, { color: '#c23934', padding: 8 }]}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function TextFieldInput({ label, value, onChangeText, required, multiline, keyboardType, placeholder }) {
  return (
    <View style={f.fieldWrap}>
      <Text style={f.label}>{required ? `* ${label}` : label}</Text>
      <TextInput
        style={[f.textInput, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType || 'default'}
        placeholder={placeholder || ''}
        placeholderTextColor="#aaa"
        autoCapitalize="words"
      />
    </View>
  );
}

function emptyForm() {
  return {
    name_of_society: '', premiumness: '',
    category: '--None--', address: '',
    depot_id: '', depot_name: '',
    locality_id: '', locality_name: '',
    segment_branch_id: '', branch_name: '',
  };
}

// ── Main Screen ───────────────────────────────────────────────────────
export default function CSPScreen() {
  const { userId } = useAuth();

  const [view, setView]             = useState('search');
  const [searchText, setSearchText] = useState('');
  const [segments, setSegments]     = useState([]);
  const [searching, setSearching]   = useState(false);
  const [selected, setSelected]     = useState(null);

  const [form, setForm]     = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  // Check-in / out state
  const [ciStatus, setCiStatus]         = useState('can_check_in');
  const [ciTime, setCiTime]             = useState(null);
  const [coTime, setCoTime]             = useState(null);
  const [ciLoading, setCiLoading]       = useState(false);
  const [ciStatusLoad, setCiStatusLoad] = useState(false);

  const [depotResults, setDepotResults]       = useState([]);
  const [localityResults, setLocalityResults] = useState([]);
  const [depotLoading, setDepotLoading]       = useState(false);
  const [localityLoading, setLocalityLoading] = useState(false);

  function setField(key, val) { setForm(p => ({ ...p, [key]: val })); }

  async function handleSearch() {
    if (!searchText || searchText.length < 3) {
      Toast.show({ type: 'error', text1: 'Minimum 3 characters required.' });
      return;
    }
    setSearching(true);
    try {
      const result = await displaySegmentsCSP(searchText);
      setSegments(result || []);
      setView('list');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSearching(false);
    }
  }

  async function handleSelectRecord(seg) {
    setSelected(seg);
    setCiStatus('can_check_in'); setCiTime(null); setCoTime(null);
    setView('detail');
    setCiStatusLoad(true);
    try {
      const res = await validateSegmentCheckIn(seg.id || seg.Id);
      setCiStatus(res.status || 'can_check_in');
      setCiTime(res.checkInTime || null);
      setCoTime(res.checkOutTime || null);
    } catch {} finally { setCiStatusLoad(false); }
  }

  async function doCheckIn() {
    setCiLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.'); return;
      }
      let pos;
      try {
        pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      } catch (locErr) {
        Toast.show({ type: 'error', text1: 'Location Error', text2: locErr.message || 'Enable location services and retry.' });
        return;
      }
      const mobileId = await getOrCreateDeviceId();
      const result   = await checkInSegment({
        lat: pos.coords.latitude, lng: pos.coords.longitude,
        recordId: selected.id || selected.Id,
        segType: 'CSP', mobId: mobileId, deviceNM: getDeviceName(),
      });
      if (result.success) {
        setCiStatus('checked_in'); setCiTime(new Date().toISOString());
        Toast.show({ type: 'success', text1: 'Check-In Successful!' });
      } else {
        Toast.show({ type: 'error', text1: result.message || 'Check-in failed.' });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message || 'Please try again.' });
    } finally { setCiLoading(false); }
  }

  async function doCheckOut() {
    setCiLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.'); return;
      }
      let pos;
      try {
        pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      } catch (locErr) {
        Toast.show({ type: 'error', text1: 'Location Error', text2: locErr.message || 'Enable location services and retry.' });
        return;
      }
      const result = await checkOutSegment({
        lat: pos.coords.latitude, lng: pos.coords.longitude,
        recordId: selected.id || selected.Id, segType: 'CSP',
      });
      if (result.success) {
        setCiStatus('day_complete'); setCoTime(new Date().toISOString());
        Toast.show({ type: 'success', text1: 'Check-Out Successful!' });
      } else {
        Toast.show({ type: 'error', text1: result.message || 'Check-out failed.' });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message || 'Please try again.' });
    } finally { setCiLoading(false); }
  }

  function openCreate() {
    setForm(emptyForm());
    setDepotResults([]);
    setLocalityResults([]);
    setView('create');
  }

  async function handleCreate() {
    if (!form.name_of_society.trim()) return Toast.show({ type: 'error', text1: '* Name is required.' });
    if (!form.address.trim())         return Toast.show({ type: 'error', text1: '* Address is required.' });
    if (!form.depot_id)               return Toast.show({ type: 'error', text1: '* Depot is required.' });
    if (!form.locality_id)            return Toast.show({ type: 'error', text1: '* Locality is required.' });

    setSaving(true);
    try {
      const result = await createSegmentCSP({ ...form, created_by: userId });
      if (result.success) {
        Toast.show({ type: 'success', text1: 'CSP record created successfully.' });
        setView('search');
        setSearchText('');
        setSegments([]);
      } else {
        Toast.show({ type: 'error', text1: 'Create failed', text2: result.message });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message });
    } finally {
      setSaving(false);
    }
  }

  function openUpdate() {
    setForm({
      name_of_society:   selected.name_of_society || '',
      premiumness:       selected.premiumness || '',
      category:          selected.category || '--None--',
      address:           selected.address || '',
      depot_id:          selected.depot_id || '',
      depot_name:        selected.depot_name || '',
      locality_id:       selected.locality_id || '',
      locality_name:     selected.locality_name || '',
      segment_branch_id: selected.segment_branch_id || '',
      branch_name:       selected.branch_name || '',
    });
    setView('update');
  }

  async function handleUpdate() {
    if (!form.name_of_society.trim()) return Toast.show({ type: 'error', text1: '* Name is required.' });
    if (!form.address.trim())         return Toast.show({ type: 'error', text1: '* Address is required.' });

    setSaving(true);
    try {
      const result = await updateSegmentCSP(selected.id || selected.Id, form);
      if (result.success) {
        Toast.show({ type: 'success', text1: 'CSP record updated successfully.' });
        setView('search');
        setSegments([]);
        setSearchText('');
      } else {
        Toast.show({ type: 'error', text1: 'Update failed', text2: result.message });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDepotSearch(q) {
    setDepotLoading(true);
    try { setDepotResults((await searchDepots(q)) || []); } catch {} finally { setDepotLoading(false); }
  }

  async function handleLocalitySearch(q) {
    setLocalityLoading(true);
    try { setLocalityResults((await searchLocalities(q)) || []); } catch {} finally { setLocalityLoading(false); }
  }

  // ─────────────────────────────────────────────
  // Views
  // ─────────────────────────────────────────────

  // ── Search View ──────────────────────────────────────────────────────
  if (view === 'search') return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Top search area — white, flush, no floating card */}
      <View style={s.searchArea}>
        <View style={s.searchRow}>
          <View style={s.searchBox}>
            <MaterialIcons name="search" size={18} color="#9aa5b4" />
            <TextInput
              style={s.searchInput}
              placeholder="Search CSP stores, localities..."
              placeholderTextColor="#9aa5b4"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searching && <ActivityIndicator size="small" color={ACCENT} />}
          </View>
          <TouchableOpacity style={[s.newBtn, { backgroundColor: ACCENT }]} onPress={openCreate}>
            <MaterialIcons name="add" size={18} color="#fff" />
            <Text style={s.newBtnText}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Empty state */}
      <View style={s.emptyState}>
        <View style={[s.emptyIconBox, { backgroundColor: LIGHT }]}>
          <MaterialIcons name="storefront" size={44} color={ACCENT} />
        </View>
        <Text style={s.emptyTitle}>Search CSP Records</Text>
        <Text style={s.emptyHint}>Type at least 3 characters and press Search</Text>
        <TouchableOpacity style={[s.emptySearchBtn, { backgroundColor: ACCENT }]} onPress={handleSearch}>
          <MaterialIcons name="search" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={s.emptySearchBtnText}>Search Now</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  // ── List View ────────────────────────────────────────────────────────
  if (view === 'list') return (
    <View style={s.page}>
      {/* Same search area */}
      <View style={s.searchArea}>
        <View style={s.searchRow}>
          <View style={s.searchBox}>
            <MaterialIcons name="search" size={18} color="#9aa5b4" />
            <TextInput
              style={s.searchInput}
              placeholder="Search CSP stores, localities..."
              placeholderTextColor="#9aa5b4"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searching
              ? <ActivityIndicator size="small" color={ACCENT} />
              : !!searchText && (
                <TouchableOpacity onPress={() => { setSearchText(''); setView('search'); }}>
                  <MaterialIcons name="close" size={16} color="#9aa5b4" />
                </TouchableOpacity>
              )}
          </View>
          <TouchableOpacity style={[s.newBtn, { backgroundColor: ACCENT }]} onPress={openCreate}>
            <MaterialIcons name="add" size={18} color="#fff" />
            <Text style={s.newBtnText}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Result count bar */}
      <View style={s.countBar}>
        <Text style={s.countText}>{segments.length} record{segments.length !== 1 ? 's' : ''} found</Text>
      </View>

      <FlatList
        data={segments}
        keyExtractor={(item, i) => item.id || String(i)}
        contentContainerStyle={s.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={[s.card, { borderLeftColor: ACCENT }]} onPress={() => handleSelectRecord(item)} activeOpacity={0.8}>
            <View style={s.cardHeader}>
              <View style={[s.cardIconBox, { backgroundColor: LIGHT }]}>
                <MaterialIcons name="storefront" size={20} color={ACCENT} />
              </View>
              <Text style={s.cardName} numberOfLines={2}>{item.name_of_society || '—'}</Text>
              <MaterialIcons name="chevron-right" size={22} color="#c8d0da" />
            </View>
            <View style={s.chipRow}>
              {!!item.depot_name && <InfoChip icon="local-shipping" label={item.depot_name} accent={ACCENT} />}
              {!!item.locality_name && <InfoChip icon="location-on" label={item.locality_name} accent={ACCENT} />}
              {!!item.category && <InfoChip icon="label" label={item.category} accent={ACCENT} />}
            </View>
            {!!item.address && <Text style={s.cardAddress} numberOfLines={1}>{item.address}</Text>}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={s.noResults}>
            <MaterialIcons name="search-off" size={42} color="#c8d0da" />
            <Text style={s.noResultsText}>No CSP records found</Text>
          </View>
        }
      />
    </View>
  );

  // ── Detail View ──────────────────────────────────────────────────────
  if (view === 'detail') return (
    <View style={s.page}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header card */}
        <View style={[s.detailHero, { borderTopColor: ACCENT }]}>
          <View style={[s.detailHeroIcon, { backgroundColor: LIGHT }]}>
            <MaterialIcons name="storefront" size={32} color={ACCENT} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.detailHeroName}>{selected?.name_of_society || '—'}</Text>
            <View style={s.chipRow}>
              {!!selected?.category && <InfoChip icon="label" label={selected.category} accent={ACCENT} />}
              {!!selected?.premiumness && <InfoChip icon="star" label={`Premium: ${selected.premiumness}`} accent={ACCENT} />}
            </View>
          </View>
          <TouchableOpacity style={[s.editFab, { borderColor: ACCENT }]} onPress={openUpdate}>
            <MaterialIcons name="edit" size={15} color={ACCENT} />
            <Text style={[s.editFabText, { color: ACCENT }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Section: Store Details */}
        <View style={s.detailCard}>
          <View style={[s.detailCardBar, { backgroundColor: ACCENT }]}>
            <MaterialIcons name="storefront" size={13} color="#fff" style={{ marginRight: 5 }} />
            <Text style={s.detailCardBarText}>STORE DETAILS</Text>
          </View>
          <SFRow L="Name" LV={selected?.name_of_society} R="Address" RV={selected?.address} />
          <SFRow L="Premiumness" LV={selected?.premiumness} R="Category" RV={selected?.category} />
          <SFRow L="Depot" LV={selected?.depot_name} R="Branch" RV={selected?.branch_name} />
          <SFRow L="Locality" LV={selected?.locality_name} R="" RV="" />
        </View>

        {/* Check-In / Check-Out Panel */}
        <View style={s.ciCard}>
          <View style={s.ciCardBar}>
            <MaterialIcons name="place" size={13} color="#fff" style={{ marginRight: 5 }} />
            <Text style={s.ciCardBarText}>ATTENDANCE</Text>
          </View>
          {ciStatusLoad ? (
            <View style={s.ciLoaderBox}>
              <ActivityIndicator color={ACCENT} />
              <Text style={s.ciLoaderText}>Loading status...</Text>
            </View>
          ) : ciStatus === 'day_complete' ? (
            <View style={s.ciBanner}>
              <MaterialIcons name="check-circle" size={22} color="#2e7d32" style={{ marginRight: 10 }} />
              <View>
                <Text style={s.ciBannerTitle}>Today's Visit Complete</Text>
                {!!ciTime  && <Text style={s.ciBannerSub}>In:  {new Date(ciTime).toLocaleTimeString()}</Text>}
                {!!coTime  && <Text style={s.ciBannerSub}>Out: {new Date(coTime).toLocaleTimeString()}</Text>}
              </View>
            </View>
          ) : ciStatus === 'checked_in' ? (
            <View>
              <View style={[s.ciBanner, { backgroundColor: '#e8f5e9' }]}>
                <MaterialIcons name="login" size={22} color="#2e7d32" style={{ marginRight: 10 }} />
                <View>
                  <Text style={[s.ciBannerTitle, { color: '#2e7d32' }]}>Checked In</Text>
                  {!!ciTime && <Text style={s.ciBannerSub}>Since: {new Date(ciTime).toLocaleTimeString()}</Text>}
                </View>
              </View>
              <TouchableOpacity style={[s.ciBtn, { backgroundColor: '#c62828' }]} onPress={doCheckOut} disabled={ciLoading}>
                {ciLoading ? <ActivityIndicator color="#fff" /> : <>
                  <MaterialIcons name="logout" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={s.ciBtnText}>Check Out</Text>
                </>}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[s.ciBtn, { backgroundColor: ACCENT }]} onPress={doCheckIn} disabled={ciLoading}>
              {ciLoading ? <ActivityIndicator color="#fff" /> : <>
                <MaterialIcons name="login" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={s.ciBtnText}>Check In</Text>
              </>}
            </TouchableOpacity>
          )}
        </View>

        {/* Action buttons */}
        <View style={s.detailActions}>
          <TouchableOpacity style={[s.primaryBtn, { backgroundColor: ACCENT, flex: 1 }]} onPress={openUpdate}>
            <MaterialIcons name="edit" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={s.primaryBtnText}>Edit Record</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.backBtn} onPress={() => setView('list')}>
            <MaterialIcons name="arrow-back" size={16} color="#444" style={{ marginRight: 4 }} />
            <Text style={s.backBtnText}>Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  // ── Create / Update Form ─────────────────────────────────────────────
  const isUpdate = view === 'update';
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.formTopBar, { backgroundColor: ACCENT }]}>
        <TouchableOpacity onPress={() => setView(isUpdate ? 'detail' : 'search')} style={{ marginRight: 12 }}>
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <MaterialIcons name={isUpdate ? 'edit' : 'add-circle-outline'} size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={s.formTopBarText}>{isUpdate ? 'Edit CSP Record' : 'New CSP Record'}</Text>
      </View>
      <ScrollView style={s.page} keyboardShouldPersistTaps="handled">
        <View style={s.formBody}>
          <Text style={[s.formSectionLabel, { color: ACCENT }]}>Basic Information</Text>
          <TextFieldInput label="Name" required value={form.name_of_society} onChangeText={v => setField('name_of_society', v)} />
          <TextFieldInput label="Premiumness" value={form.premiumness} onChangeText={v => setField('premiumness', v)} keyboardType="numeric" placeholder="e.g. 5" />
          <DropdownPicker label="Category" value={form.category} options={CATEGORY_OPTIONS} onSelect={v => setField('category', v)} />
          <TextFieldInput label="Address" required value={form.address} onChangeText={v => setField('address', v)} multiline />

          <Text style={[s.formSectionLabel, { color: ACCENT }]}>Depot & Locality</Text>
          <SearchPicker
            label="Depot" required placeholder="Search Territory Masters..."
            value={form.depot_id} displayValue={form.depot_name} accent={ACCENT}
            onSearch={handleDepotSearch} results={depotResults} loading={depotLoading}
            onSelect={r => r
              ? setForm(p => ({ ...p, depot_id: r.id, depot_name: r.name, segment_branch_id: r.rmd_branch_id || '', branch_name: r.branch_name || '' }))
              : setForm(p => ({ ...p, depot_id: '', depot_name: '', segment_branch_id: '', branch_name: '' }))}
          />
          <SearchPicker
            label="Locality" required placeholder="Search Locality..."
            value={form.locality_id} displayValue={form.locality_name} accent={ACCENT}
            onSearch={handleLocalitySearch} results={localityResults} loading={localityLoading}
            onSelect={r => r
              ? setForm(p => ({ ...p, locality_id: r.id, locality_name: r.name }))
              : setForm(p => ({ ...p, locality_id: '', locality_name: '' }))}
          />

          <View style={s.formActions}>
            <TouchableOpacity style={[s.primaryBtn, { backgroundColor: ACCENT, flex: 1 }]} onPress={isUpdate ? handleUpdate : handleCreate} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : (
                <>
                  <MaterialIcons name={isUpdate ? 'save' : 'check-circle'} size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={s.primaryBtnText}>{isUpdate ? 'Save Changes' : 'Create Record'}</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={() => setView(isUpdate ? 'detail' : 'search')}>
              <MaterialIcons name="close" size={16} color="#444" style={{ marginRight: 4 }} />
              <Text style={s.backBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Main styles ─────────────────────────────────
const s = StyleSheet.create({
  page:             { flex: 1, backgroundColor: '#f0f3f8' },
  // Search area — flush white, no floating card
  searchArea:       { backgroundColor: '#fff', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e4e9f0' },
  searchRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchBox:        { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#dde3ec', borderRadius: 8, paddingHorizontal: 11, height: 44 },
  searchInput:      { flex: 1, fontSize: 14, color: '#16325c', marginLeft: 7, height: 44 },
  newBtn:           { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 14, height: 44, gap: 5 },
  newBtnText:       { color: '#fff', fontWeight: '700', fontSize: 13 },
  // Count bar
  countBar:         { paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' },
  countText:        { fontSize: 12, color: '#9aa5b4', fontWeight: '500' },
  // List content
  listContent:      { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 32 },
  // Record cards
  card:             { backgroundColor: '#fff', borderRadius: 10, marginBottom: 10, borderLeftWidth: 5, padding: 14, elevation: 2, shadowColor: '#1a2340', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  cardHeader:       { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  cardIconBox:      { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardName:         { flex: 1, fontSize: 14, fontWeight: '700', color: '#16325c', lineHeight: 20 },
  chipRow:          { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 2 },
  cardAddress:      { fontSize: 12, color: '#9aa5b4', marginTop: 4 },
  // Empty state
  emptyState:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 50 },
  emptyIconBox:     { width: 88, height: 88, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:       { fontSize: 17, fontWeight: '700', color: '#2d3a4a', marginBottom: 6 },
  emptyHint:        { fontSize: 13, color: '#9aa5b4', textAlign: 'center', paddingHorizontal: 32, lineHeight: 20, marginBottom: 20 },
  emptySearchBtn:   { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 11 },
  emptySearchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  noResults:        { alignItems: 'center', paddingTop: 48, paddingBottom: 24 },
  noResultsText:    { fontSize: 14, color: '#9aa5b4', marginTop: 10, fontWeight: '500' },
  // Detail
  detailHero:       { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 16, borderTopWidth: 4, flexDirection: 'row', alignItems: 'flex-start', elevation: 2, shadowColor: '#1a2340', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  detailHeroIcon:   { width: 54, height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  detailHeroName:   { fontSize: 16, fontWeight: '700', color: '#16325c', marginBottom: 8, lineHeight: 22, flex: 1 },
  editFab:          { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  editFabText:      { fontSize: 12, fontWeight: '700', marginLeft: 3 },
  detailCard:       { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 10, borderRadius: 10, overflow: 'hidden', elevation: 1, shadowColor: '#1a2340', shadowOpacity: 0.05, shadowRadius: 4 },
  detailCardBar:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9 },
  detailCardBarText:{ fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.6 },
  detailActions:    { flexDirection: 'row', gap: 10, marginHorizontal: 12, marginTop: 4, marginBottom: 32 },
  // Check-in / out card
  ciCard:           { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 10, borderRadius: 10, overflow: 'hidden', elevation: 1, shadowColor: '#1a2340', shadowOpacity: 0.05, shadowRadius: 4 },
  ciCardBar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#37474f' },
  ciCardBarText:    { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.6 },
  ciLoaderBox:      { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 },
  ciLoaderText:     { fontSize: 13, color: '#9aa5b4' },
  ciBanner:         { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#f1f8e9' },
  ciBannerTitle:    { fontSize: 14, fontWeight: '700', color: '#33691e' },
  ciBannerSub:      { fontSize: 12, color: '#558b2f', marginTop: 2 },
  ciBtn:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 12, borderRadius: 8, paddingVertical: 13 },
  ciBtnText:        { color: '#fff', fontWeight: '700', fontSize: 14 },
  // Form
  formTopBar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13 },
  formTopBarText:   { fontSize: 15, fontWeight: '700', color: '#fff' },
  formBody:         { padding: 16, paddingBottom: 40 },
  formSectionLabel: { fontSize: 11, fontWeight: '700', color: '#9aa5b4', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 20, marginBottom: 10 },
  formActions:      { flexDirection: 'row', gap: 10, marginTop: 24 },
  primaryBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 8, paddingVertical: 13, paddingHorizontal: 16 },
  primaryBtnText:   { color: '#fff', fontWeight: '700', fontSize: 14 },
  backBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#dde3ec', borderRadius: 8, paddingVertical: 13, paddingHorizontal: 16, backgroundColor: '#fff' },
  backBtnText:      { fontSize: 13, fontWeight: '600', color: '#444' },
});

// Form field styles
const f = StyleSheet.create({
  fieldWrap:          { marginBottom: 16 },
  label:              { fontSize: 12, fontWeight: '600', color: '#5a6475', marginBottom: 6 },
  textInput:          { borderWidth: 1, borderColor: '#dde3ec', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#16325c', backgroundColor: '#fff' },
  dropdown:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#dde3ec', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: '#fff' },
  dropdownText:       { fontSize: 14, color: '#16325c' },
  overlay:            { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 24 },
  pickerBox:          { backgroundColor: '#fff', borderRadius: 14, maxHeight: 320, elevation: 10, overflow: 'hidden' },
  pickerItem:         { paddingVertical: 14, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: '#f4f6fa' },
  pickerItemText:     { fontSize: 14, color: '#16325c' },
  searchRow:          { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#dde3ec', borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' },
  searchInput:        { flex: 1, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#16325c' },
  searchIconBtn:      { paddingHorizontal: 12, paddingVertical: 11 },
  searchSelected:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11 },
  searchSelectedText: { fontSize: 14, fontWeight: '600', flex: 1 },
  clearBtn:           { fontSize: 18, color: '#c23934', paddingLeft: 8 },
  searchDropdown:     { borderWidth: 1, borderColor: '#dde3ec', borderRadius: 8, backgroundColor: '#fff', marginTop: 4, maxHeight: 200, elevation: 6 },
  searchDropdownItem: { paddingVertical: 13, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#f4f6fa' },
  searchDropdownText: { fontSize: 14, color: '#16325c' },
});
