import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView,
  Platform, Modal, Switch,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {
  searchCampaigns, getCampaignById, createCampaign, updateCampaign, addCampaignMember,
  addCampaignMemberWithLead, bulkAddCampaignMembers, syncCampaign, callBatch, getBatchStatus,
  bulkInsertPromotionLeads, searchPromotionLeads, getLeadById,
  syncTelecallers, syncCampaignMembers, getCTIStatus,
  searchTelecallerAssignments, createTelecallerAssignment, searchTelecallerUsers,
} from '../api/api';
import PromotionLeadScreen from './PromotionLeadScreen';

// ── Picklists ────────────────────────────────────────────────────────
const TYPE_OPTIONS   = ['Event', 'Webinar', 'Conference', 'Email', 'Phone', 'Direct Mail', 'Print', 'Other'];
const STATUS_OPTIONS = ['--None--', 'Planned', 'In Progress', 'Completed', 'Aborted'];
const MEMBER_STATUS  = ['Sent', 'Opened', 'Responded', 'Registered', 'Attended', 'Opted Out'];

// ── Shared form components ───────────────────────────────────────────
function SectionHeader({ title }) {
  return (
    <View style={f.sectionWrap}>
      <View style={f.sectionLine} />
      <Text style={f.sectionTitle}>{title}</Text>
      <View style={f.sectionLine} />
    </View>
  );
}

function TF({ label, value, onChange, required, multiline, keyboardType, autoCapitalize, placeholder }) {
  return (
    <View style={f.fieldWrap}>
      <Text style={f.label}>{required ? `* ${label}` : label}</Text>
      <TextInput
        style={[f.textInput, multiline && { height: 72, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboardType || 'default'}
        placeholder={placeholder || ''}
        placeholderTextColor="#aaa"
        autoCapitalize={autoCapitalize ?? 'words'}
      />
    </View>
  );
}

function DropdownPicker({ label, value, options, onSelect, required }) {
  const [open, setOpen] = useState(false);
  const display = value || '--None--';
  return (
    <View style={f.fieldWrap}>
      <Text style={f.label}>{required ? `* ${label}` : label}</Text>
      <TouchableOpacity style={f.dropdown} onPress={() => setOpen(true)}>
        <Text style={[f.dropdownText, display === '--None--' && { color: '#aaa' }]}>{display}</Text>
        <Text style={f.dropdownArrow}>▼</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={f.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={f.pickerBox}>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={f.pickerItem} onPress={() => { onSelect(item === '--None--' ? '' : item); setOpen(false); }}>
                  <Text style={[f.pickerItemText, item === display && { color: '#0070d2', fontWeight: '700' }]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function ToggleField({ label, value, onChange }) {
  return (
    <View style={f.toggleWrap}>
      <Text style={f.label}>{label}</Text>
      <Switch value={!!value} onValueChange={onChange} trackColor={{ false: '#d8dde6', true: '#0070d2' }} thumbColor="#fff" />
    </View>
  );
}

// ── Date Picker Field ────────────────────────────────────────────────
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function DatePickerField({ label, value, onChange, required }) {
  const today = new Date();
  const [open,     setOpen]     = useState(false);
  const [selYear,  setSelYear]  = useState(today.getFullYear());
  const [selMonth, setSelMonth] = useState(today.getMonth());
  const [selDay,   setSelDay]   = useState(today.getDate());

  function openPicker() {
    if (value) {
      const parts = String(value).slice(0, 10).split('-');
      if (parts.length === 3) {
        setSelYear(parseInt(parts[0]) || today.getFullYear());
        setSelMonth((parseInt(parts[1]) || 1) - 1);
        setSelDay(parseInt(parts[2]) || 1);
      }
    }
    setOpen(true);
  }

  function confirm() {
    const maxDay = new Date(selYear, selMonth + 1, 0).getDate();
    const day = Math.min(selDay, maxDay);
    onChange(`${selYear}-${String(selMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    setOpen(false);
  }

  const years   = Array.from({ length: 12 }, (_, i) => today.getFullYear() - 2 + i);
  const maxDay  = new Date(selYear, selMonth + 1, 0).getDate();
  const days    = Array.from({ length: maxDay }, (_, i) => i + 1);
  const display = value ? (() => {
    const d = new Date(value);
    return isNaN(d) ? value : `${d.getDate()} ${MONTHS_FULL[d.getMonth()].slice(0,3)} ${d.getFullYear()}`;
  })() : '';

  return (
    <View style={f.fieldWrap}>
      <Text style={f.label}>{required ? `* ${label}` : label}</Text>
      <TouchableOpacity style={f.dateBtn} onPress={openPicker}>
        <Text style={[f.dateBtnText, !value && { color: '#aaa' }]}>
          {display || 'Select date...'}
        </Text>
        <Text style={{ fontSize: 16, color: '#706e6b' }}>📅</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={f.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={f.dpCard} onStartShouldSetResponder={() => true}>
            <Text style={f.dpTitle}>{label}</Text>
            <View style={f.dpRow}>
              {/* Day */}
              <View style={f.dpCol}>
                <Text style={f.dpColLabel}>Day</Text>
                <ScrollView style={f.dpScroll} showsVerticalScrollIndicator={false}>
                  {days.map(d => (
                    <TouchableOpacity key={d} style={[f.dpItem, d === selDay && f.dpItemSel]} onPress={() => setSelDay(d)}>
                      <Text style={[f.dpItemText, d === selDay && f.dpItemTextSel]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {/* Month */}
              <View style={[f.dpCol, { flex: 1.8 }]}>
                <Text style={f.dpColLabel}>Month</Text>
                <ScrollView style={f.dpScroll} showsVerticalScrollIndicator={false}>
                  {MONTHS_FULL.map((m, i) => (
                    <TouchableOpacity key={i} style={[f.dpItem, i === selMonth && f.dpItemSel]} onPress={() => setSelMonth(i)}>
                      <Text style={[f.dpItemText, i === selMonth && f.dpItemTextSel]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {/* Year */}
              <View style={f.dpCol}>
                <Text style={f.dpColLabel}>Year</Text>
                <ScrollView style={f.dpScroll} showsVerticalScrollIndicator={false}>
                  {years.map(y => (
                    <TouchableOpacity key={y} style={[f.dpItem, y === selYear && f.dpItemSel]} onPress={() => setSelYear(y)}>
                      <Text style={[f.dpItemText, y === selYear && f.dpItemTextSel]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={f.dpFooter}>
              <TouchableOpacity style={f.dpClearBtn} onPress={() => { onChange(''); setOpen(false); }}>
                <Text style={f.dpClearText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={f.dpConfirmBtn} onPress={confirm}>
                <Text style={f.dpConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ── Campaign Lookup Field ────────────────────────────────────────────
function CampaignLookupField({ label, value, displayValue, onSelect, required }) {
  const [open,      setOpen]      = useState(false);
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState([]);
  const [searching, setSearching] = useState(false);

  async function doSearch(q) {
    setSearching(true);
    try { setResults((await searchCampaigns(q)) || []); }
    catch (_) {}
    finally { setSearching(false); }
  }

  function openModal() { setQuery(''); doSearch(''); setOpen(true); }

  return (
    <View style={f.fieldWrap}>
      <Text style={f.label}>{required ? `* ${label}` : label}</Text>
      {value ? (
        <View style={f.lookupSelected}>
          <Text style={f.lookupSelectedIcon}>📣</Text>
          <Text style={f.lookupSelectedText} numberOfLines={1}>{displayValue}</Text>
          <TouchableOpacity onPress={() => onSelect('', '')} style={{ padding: 4 }}>
            <Text style={{ color: '#706e6b', fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={f.lookupTrigger} onPress={openModal}>
          <Text style={f.lookupTriggerText}>Search campaigns...</Text>
          <Text style={{ fontSize: 14, color: '#0070d2' }}>⌕</Text>
        </TouchableOpacity>
      )}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={f.lookupBackdrop}>
          <View style={f.lookupCard}>
            <View style={f.lookupHeader}>
              <Text style={f.lookupTitle}>Select Parent Campaign</Text>
              <TouchableOpacity onPress={() => setOpen(false)}><Text style={f.lookupClose}>✕</Text></TouchableOpacity>
            </View>
            <View style={f.lookupSearch}>
              <TextInput
                style={f.lookupSearchInput}
                placeholder="Search by campaign name..."
                value={query}
                onChangeText={q => { setQuery(q); doSearch(q); }}
                placeholderTextColor="#aaa"
                autoCapitalize="none"
                autoFocus
              />
              {searching && <ActivityIndicator size="small" color="#0070d2" style={{ marginLeft: 8 }} />}
            </View>
            <FlatList
              data={results}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={f.lookupItem} onPress={() => { onSelect(item.id, item.campaign_name); setOpen(false); }}>
                  <Text style={f.lookupItemIcon}>📣</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={f.lookupItemName}>{item.campaign_name}</Text>
                    {item.status ? <Text style={f.lookupItemSub}>{item.status}</Text> : null}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={!searching && <Text style={f.lookupListEmpty}>No campaigns found</Text>}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function emptyForm() {
  return {
    campaign_name: '', active: true, parent_campaign_id: '', parent_campaign_name: '',
    type: 'Event', status: '', start_date: '', end_date: '',
    description: '', source: '', no_of_call_attempts: '',
    num_sent: '', budgeted_cost: '', expected_response_pct: '0.00',
    actual_cost: '', expected_revenue: '', responses_in_campaign: '',
    campaign_owner: '',
  };
}

// ── Main Screen ──────────────────────────────────────────────────────
export default function CampaignScreen() {
  const [view, setView]             = useState('list');
  const [campaigns, setCampaigns]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selected, setSelected]     = useState(null);
  const [form, setForm]             = useState(emptyForm());
  const [saving, setSaving]         = useState(false);
  const [detailTab, setDetailTab]   = useState('details');
  const [memberModal,  setMemberModal]  = useState(false);
  const [csvModal,     setCsvModal]     = useState(false);   // Campaign Members CSV
  const [plnCsvModal,  setPlnCsvModal]  = useState(false);   // Promotion Leads CSV
  const [plnView,      setPlnView]      = useState(false);
  const [tanModal,     setTanModal]     = useState(false);
  const [assignments,  setAssignments]  = useState([]);
  const [syncing,      setSyncing]      = useState(false);
  const [calling,      setCalling]      = useState(false);
  const [batchLog,     setBatchLog]     = useState(null);
  const [batchModal,   setBatchModal]   = useState(false);
  const [plnCount,     setPlnCount]     = useState(0);      // live promotion lead count
  const [leadModal,    setLeadModal]    = useState(false);  // lead detail modal
  const [leadDetail,   setLeadDetail]   = useState(null);   // lead data for modal
  const [syncModal,    setSyncModal]    = useState(false);  // CTI sync steps modal
  const [ctiStatus,    setCtiStatus]    = useState(null);   // campaign CTI status

  useEffect(() => { loadCampaigns(''); }, []);

  async function loadCampaigns(q) {
    setLoading(true);
    try { setCampaigns((await searchCampaigns(q)) || []); }
    catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  }

  const sf = (key, val) => setForm(p => ({ ...p, [key]: val }));

  async function openDetail(item) {
    setLoading(true);
    try {
      const [data, tans, plns, cti] = await Promise.all([
        getCampaignById(item.id),
        searchTelecallerAssignments('', item.id).catch(() => []),
        searchPromotionLeads('', item.id).catch(() => []),
        getCTIStatus(item.id).catch(() => null),
      ]);
      setSelected(data);
      setAssignments(tans);
      setPlnCount(plns.length);
      setCtiStatus(cti);
      setDetailTab('details');
      setPlnView(false);
      setView('detail');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshAssignments(campaignId) {
    try { setAssignments((await searchTelecallerAssignments('', campaignId)) || []); }
    catch (_) {}
  }

  async function handleMemberPress(member) {
    if (!member.lead_id) return;
    setLoading(true);
    try {
      const lead = await getLeadById(member.lead_id);
      setLeadDetail(lead);
      setLeadModal(true);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshCtiStatus(campaignId) {
    try { setCtiStatus(await getCTIStatus(campaignId)); } catch (_) {}
  }

  async function handleSyncCampaign(campaignId) {
    setSyncing(true);
    try {
      const res = await syncCampaign(campaignId);
      Alert.alert('Sync Campaign', res.message || 'Sync completed successfully.');
    } catch (e) {
      Alert.alert('Sync Failed', e.message);
    } finally { setSyncing(false); }
  }

  async function handleCallBatch(campaignId) {
    setCalling(true);
    try {
      const res = await callBatch(campaignId);
      if (res.success && res.batch_id) {
        setBatchLog({ ...res, status: 'running', sent_wa: 0, sent_sms: 0, sent_email: 0, failed_count: 0 });
        setBatchModal(true);
        // Poll for completion every 3 seconds
        pollBatchStatus(campaignId, res.batch_id);
      } else {
        Alert.alert('Call Batch', res.message || 'Batch initiated.');
      }
    } catch (e) {
      Alert.alert('Call Batch Failed', e.message);
    } finally { setCalling(false); }
  }

  function pollBatchStatus(campaignId, batchId) {
    const interval = setInterval(async () => {
      try {
        const status = await getBatchStatus(campaignId, batchId);
        setBatchLog(status);
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval);
        }
      } catch (_) { clearInterval(interval); }
    }, 3000);
  }

  function openCreate() {
    setForm(emptyForm());
    setView('create');
  }

  function openUpdate() {
    const d = selected;
    setForm({
      campaign_name:        d.campaign_name        || '',
      active:               !!d.active,
      parent_campaign_id:   d.parent_campaign_id   || '',
      parent_campaign_name: d.parent_campaign_name || '',
      type:                 d.type                 || 'Event',
      status:               d.status               || '',
      start_date:           d.start_date ? String(d.start_date).slice(0, 10) : '',
      end_date:             d.end_date   ? String(d.end_date).slice(0, 10)   : '',
      description:          d.description          || '',
      source:               d.source               || '',
      no_of_call_attempts:  d.no_of_call_attempts != null ? String(d.no_of_call_attempts) : '',
      num_sent:             d.num_sent             != null ? String(d.num_sent)             : '',
      budgeted_cost:        d.budgeted_cost        != null ? String(d.budgeted_cost)        : '',
      expected_response_pct:d.expected_response_pct != null ? String(d.expected_response_pct) : '0.00',
      actual_cost:          d.actual_cost          != null ? String(d.actual_cost)          : '',
      expected_revenue:     d.expected_revenue     != null ? String(d.expected_revenue)     : '',
      responses_in_campaign:d.responses_in_campaign != null ? String(d.responses_in_campaign) : '',
      campaign_owner:       d.campaign_owner       || '',
    });
    setView('update');
  }

  async function handleSave(isUpdate) {
    if (!form.campaign_name.trim())
      return Toast.show({ type: 'error', text1: '* Campaign Name is required.' });
    setSaving(true);
    try {
      const payload = { ...form };
      const result  = isUpdate
        ? await updateCampaign(selected.id, payload)
        : await createCampaign(payload);
      if (result.success) {
        Toast.show({ type: 'success', text1: `Campaign ${isUpdate ? 'updated' : 'created'} successfully.` });
        loadCampaigns('');
        if (isUpdate) {
          const updated = await getCampaignById(selected.id);
          setSelected(updated);
          setView('detail');
        } else {
          setView('list');
        }
      } else {
        Toast.show({ type: 'error', text1: result.error || 'Save failed' });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message });
    } finally {
      setSaving(false);
    }
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────
  if (view === 'list') return (
    <View style={s.container}>
      <View style={s.listHeader}>
        <View style={s.searchRow}>
          <TextInput
            style={s.searchInput}
            placeholder="Search campaigns..."
            placeholderTextColor="#aaa"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={() => loadCampaigns(searchText.trim())}
            returnKeyType="search"
          />
          <TouchableOpacity style={s.searchBtn} onPress={() => loadCampaigns(searchText.trim())} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.searchBtnText}>Search</Text>}
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.newBtn} onPress={openCreate}>
          <Text style={s.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.listSubtitle}>
        {searchText.trim() ? `Results for "${searchText}"` : 'Recently Viewed'}
        {campaigns.length > 0 ? `  •  ${campaigns.length} item${campaigns.length !== 1 ? 's' : ''}` : ''}
        {campaigns.length > 0 ? ' • Updated a few seconds ago' : ''}
      </Text>

      <View style={s.tableHeader}>
        <Text style={[s.th, { flex: 2.2 }]}>CAMPAIGN NAME</Text>
        <Text style={[s.th, { flex: 1.5 }]}>PARENT C...</Text>
        <Text style={[s.th, { flex: 1 }]}>TYPE</Text>
        <Text style={[s.th, { flex: 1 }]}>STATUS</Text>
        <Text style={[s.th, { flex: 1.2 }]}>START DATE</Text>
      </View>

      <FlatList
        data={campaigns}
        keyExtractor={(item, i) => item.id || String(i)}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.tableRow} onPress={() => openDetail(item)}>
            <View style={{ flex: 2.2 }}>
              <Text style={s.tdLink} numberOfLines={1}>{item.campaign_name}</Text>
            </View>
            <Text style={[s.td, { flex: 1.5 }]} numberOfLines={1}>{item.parent_campaign_name || '—'}</Text>
            <Text style={[s.td, { flex: 1 }]}  numberOfLines={1}>{item.type || '—'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={statusBadgeStyle(item.status)} numberOfLines={1}>{item.status || '—'}</Text>
            </View>
            <Text style={[s.td, { flex: 1.2 }]} numberOfLines={1}>{formatDate(item.start_date)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={!loading && (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>📣</Text>
            <Text style={s.emptyText}>No campaigns found</Text>
          </View>
        )}
      />
    </View>
  );

  // ── DETAIL VIEW ────────────────────────────────────────────────────
  if (view === 'detail') {
    const d = selected || {};
    const members = d.members || [];

    // ── FULL-SCREEN PROMOTION LEADS VIEW (replaces detail content) ───
    if (plnView) {
      return (
        <View style={{ flex: 1, backgroundColor: '#f4f6f9' }}>
          {/* Professional back-bar header */}
          <View style={sd.plnFullHeader}>
            <TouchableOpacity style={sd.plnBackBtn} onPress={() => setPlnView(false)}>
              <Text style={sd.plnBackArrow}>‹</Text>
              <Text style={sd.plnBackText}>Campaign</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, marginHorizontal: 10 }}>
              <Text style={sd.plnFullTitle} numberOfLines={1}>{d.campaign_name}</Text>
              <Text style={sd.plnFullSub}>Promotion Leads  •  {plnCount} record{plnCount !== 1 ? 's' : ''}</Text>
            </View>
            <TouchableOpacity style={sd.plnUploadHeaderBtn} onPress={() => setPlnCsvModal(true)}>
              <Text style={sd.plnUploadHeaderBtnText}>⬆ Upload</Text>
            </TouchableOpacity>
          </View>
          <PromotionLeadScreen initialCampaignId={d.id} initialCampaignName={d.campaign_name} />
          <PromotionLeadsCSVModal
            visible={plnCsvModal}
            campaign={d}
            onClose={() => { setPlnCsvModal(false); searchPromotionLeads('', d.id).then(r => setPlnCount(r.length)).catch(() => {}); }}
          />
        </View>
      );
    }

    // ── CTI sync-status badge (shown when status is set) ─────────────
    const ctiSyncStatus = ctiStatus?.cti_sync_status;
    const ctiStatusColor = {
      'Campaign Sync Success': '#1a7431', 'Telecallers Sync Success': '#1a7431',
      'Campaign Members Sync Success': '#1a7431',
      'Campaign Sync Failed': '#c0392b', 'Telecallers Sync Failed': '#c0392b',
      'Campaign Members Sync Failed': '#c0392b',
      'Campaign Members Sync Initiated': '#856404',
    };

    return (
      <View style={{ flex: 1, backgroundColor: '#f4f6f9' }}>

        {/* ── Header card ──────────────────────────────────────────── */}
        <View style={sd.headerCard}>
          <View style={sd.headerTop}>
            <TouchableOpacity onPress={() => setView('list')} style={sd.backChip}>
              <Text style={sd.backChipText}>‹ Campaigns</Text>
            </TouchableOpacity>
            <TouchableOpacity style={sd.editBtn} onPress={openUpdate}>
              <Text style={sd.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={sd.headerMeta}>
            <View style={sd.iconBox}>
              <Text style={sd.iconText}>📣</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={sd.recordLabel}>Campaign</Text>
              <Text style={sd.recordName} numberOfLines={2}>{d.campaign_name}</Text>
            </View>
          </View>
          {/* Quick info pills */}
          <View style={sd.quickBar}>
            {d.status ? <StatusPill value={d.status} /> : null}
            <QuickItem label="Start" value={formatDate(d.start_date)} />
            <QuickItem label="End"   value={formatDate(d.end_date)} />
            {d.source ? <QuickItem label="Source" value={d.source} /> : null}
            {d.no_of_call_attempts != null && <QuickItem label="Call Attempts" value={String(d.no_of_call_attempts)} />}
          </View>
          {/* CTI sync status bar */}
          {ctiSyncStatus ? (
            <View style={[sd.ctiBar, { borderColor: ctiStatusColor[ctiSyncStatus] || '#d8dde6' }]}>
              <Text style={[sd.ctiBarText, { color: ctiStatusColor[ctiSyncStatus] || '#444' }]}>
                CTI: {ctiSyncStatus}
              </Text>
              {ctiStatus?.cti_error_reason ? (
                <Text style={sd.ctiBarError} numberOfLines={1}>{ctiStatus.cti_error_reason}</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* ── Action buttons ───────────────────────────────────────── */}
        <View style={sd.actionRow}>
          <TouchableOpacity style={sd.actionBtn} onPress={() => setCsvModal(true)}>
            <Text style={sd.actionBtnIcon}>⬆</Text>
            <Text style={sd.actionBtnText}>Upload CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[sd.actionBtn, calling && sd.actionBtnDisabled]}
            onPress={() => handleCallBatch(d.id)} disabled={calling}
          >
            {calling ? <ActivityIndicator size="small" color="#0070d2" /> : (
              <>
                <Text style={sd.actionBtnIcon}>💬</Text>
                <Text style={sd.actionBtnText}>Call Batch</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[sd.actionBtn, sd.actionBtnPrimary]}
            onPress={() => setSyncModal(true)}
          >
            <Text style={sd.actionBtnIcon}>🔄</Text>
            <Text style={[sd.actionBtnText, { color: '#0070d2' }]}>Sync to CTI</Text>
          </TouchableOpacity>
        </View>

        {/* ── Tab bar ──────────────────────────────────────────────── */}
        <View style={sd.tabBar}>
          {['details', 'related'].map(tab => (
            <TouchableOpacity key={tab} style={sd.tabBtn} onPress={() => setDetailTab(tab)}>
              <Text style={[sd.tabLabel, detailTab === tab && sd.tabLabelActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {detailTab === tab && <View style={sd.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {detailTab === 'details' ? (
            <>
              <SFSection title="Campaign Information" onEdit={openUpdate}>
                <SFRow L="Campaign Name"    LV={d.campaign_name}          R="Campaign Owner"  RV={d.campaign_owner}          onEdit={openUpdate} />
                <SFRow L="Active"           LV={d.active ? '✓' : '—'}     R="Status"          RV={d.status}                  onEdit={openUpdate} />
                <SFRow L="Parent Campaign"  LV={d.parent_campaign_name}    R="Start Date"      RV={formatDate(d.start_date)}  onEdit={openUpdate} />
                <SFRow L="Type"             LV={d.type}                    R="End Date"        RV={formatDate(d.end_date)}    onEdit={openUpdate} />
                <SFRow L="Source"           LV={d.source}                  R="No of call attempts" RV={d.no_of_call_attempts != null ? String(d.no_of_call_attempts) : ''} onEdit={openUpdate} />
                <SFRow L="Description"      LV={d.description}             R=""                RV=""                         onEdit={openUpdate} />
              </SFSection>
              <SFSection title="Planning" onEdit={openUpdate}>
                <SFRow L="Num Sent in Campaign"         LV={d.num_sent != null ? String(d.num_sent) : '0'}                  R="Budgeted Cost"    RV={formatCurrency(d.budgeted_cost)}   onEdit={openUpdate} />
                <SFRow L="Expected Response (%)"        LV={d.expected_response_pct != null ? `${d.expected_response_pct}%` : '0.00%'} R="Actual Cost" RV={formatCurrency(d.actual_cost)} onEdit={openUpdate} />
                <SFRow L="Expected Revenue"             LV={formatCurrency(d.expected_revenue)} R="Responses in Campaign"   RV={d.responses_in_campaign != null ? String(d.responses_in_campaign) : '0'} onEdit={openUpdate} />
              </SFSection>
              {ctiStatus && (
                <SFSection title="CTI Sync Information">
                  <SFRow L="CTI Sync Status"      LV={ctiStatus.cti_sync_status || '—'}     R="CTI Parent Campaign"  RV={ctiStatus.cti_parent_campaign || '—'} />
                  <SFRow L="Campaign Lead ID"     LV={ctiStatus.cti_campaign_lead_id != null ? String(ctiStatus.cti_campaign_lead_id) : '—'} R="User Mapping ID" RV={ctiStatus.cti_lead_id_for_user_mapping != null ? String(ctiStatus.cti_lead_id_for_user_mapping) : '—'} />
                  {ctiStatus.cti_error_reason ? <SFRow L="Error Reason" LV={ctiStatus.cti_error_reason} R="" RV="" /> : null}
                </SFSection>
              )}
            </>
          ) : (
            <>
              {/* ── Campaign Members ────────────────────────────── */}
              <RelatedSection
                title="Campaign Members"
                color="#d44280"
                count={members.length}
                onNew={() => setMemberModal(true)}
                hint="Tap a member to view Lead details"
              >
                {members.length > 0 ? (
                  <>
                    <View style={sd.relatedTableHead}>
                      <Text style={[sd.relatedTH, { flex: 2.2 }]}>NAME</Text>
                      <Text style={[sd.relatedTH, { flex: 1.6 }]}>MOBILE</Text>
                      <Text style={[sd.relatedTH, { flex: 1.2 }]}>STATUS</Text>
                      <Text style={[sd.relatedTH, { flex: 1 }]}>SYNC</Text>
                    </View>
                    {members.map((m, i) => (
                      <TouchableOpacity
                        key={m.id || i}
                        style={[sd.relatedRow, m.lead_id && sd.relatedRowClickable]}
                        onPress={() => handleMemberPress(m)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 2.2 }}>
                          <Text style={sd.relatedCellLink} numberOfLines={1}>
                            {[m.first_name || m.lead_first_name, m.last_name || m.lead_last_name].filter(Boolean).join(' ') || '—'}
                          </Text>
                          <Text style={sd.relatedCellSub} numberOfLines={1}>{m.member_type || 'Lead'}</Text>
                        </View>
                        <Text style={[sd.relatedCell, { flex: 1.6 }]} numberOfLines={1}>{m.mobile || '—'}</Text>
                        <View style={{ flex: 1.2 }}>
                          <Text style={memberStatusBadge(m.status)}>{m.status || 'Sent'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          {m.sync_status ? (
                            <Text style={syncBadge(m.sync_status)}>{m.sync_status}</Text>
                          ) : <Text style={sd.relatedCell}>—</Text>}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </>
                ) : (
                  <View style={sd.relatedEmpty}>
                    <Text style={sd.relatedEmptyIcon}>👥</Text>
                    <Text style={sd.relatedEmptyText}>No campaign members yet.</Text>
                    <Text style={sd.relatedEmptyHint}>Click "+ New" to add a member or upload CSV.</Text>
                  </View>
                )}
              </RelatedSection>

              {/* ── Promotion Leads ──────────────────────────────── */}
              <RelatedSection title="Promotion Leads" color="#f59e0b" count={plnCount}>
                <View style={sd.plnRelatedBtns}>
                  <TouchableOpacity style={sd.plnActionBtn} onPress={() => setPlnView(true)}>
                    <Text style={sd.plnActionBtnText}>📋  View All Leads →</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[sd.plnActionBtn, { borderColor: '#10b981' }]} onPress={() => setPlnCsvModal(true)}>
                    <Text style={[sd.plnActionBtnText, { color: '#059669' }]}>⬆  Upload CSV</Text>
                  </TouchableOpacity>
                </View>
                {plnCount === 0 && (
                  <View style={sd.relatedEmpty}>
                    <Text style={sd.relatedEmptyIcon}>📋</Text>
                    <Text style={sd.relatedEmptyText}>No promotion leads yet.</Text>
                    <Text style={sd.relatedEmptyHint}>Upload a CSV to bulk import prospect data.</Text>
                  </View>
                )}
              </RelatedSection>

              {/* ── Telecaller Assignments ────────────────────────── */}
              <RelatedSection title="Telecaller Assignments" color="#6929c4" count={assignments.length} onNew={() => setTanModal(true)}>
                {assignments.length > 0 ? (
                  <>
                    <View style={sd.relatedTableHead}>
                      <Text style={[sd.relatedTH, { flex: 1.4 }]}>TAN NO.</Text>
                      <Text style={[sd.relatedTH, { flex: 2.2 }]}>TELECALLER</Text>
                      <Text style={[sd.relatedTH, { flex: 0.8 }]}>ACTIVE</Text>
                      <Text style={[sd.relatedTH, { flex: 1.6 }]}>SYNC STATUS</Text>
                    </View>
                    {assignments.map((a, i) => (
                      <View key={a.id || i} style={sd.relatedRow}>
                        <Text style={[sd.relatedCellLink, { flex: 1.4 }]} numberOfLines={1}>{a.tan_number || '—'}</Text>
                        <Text style={[sd.relatedCell, { flex: 2.2 }]} numberOfLines={1}>{a.telecaller_name || '—'}</Text>
                        <View style={{ flex: 0.8, alignItems: 'center' }}>
                          <Text style={a.is_active ? sd.activeChip : sd.inactiveChip}>{a.is_active ? 'Yes' : 'No'}</Text>
                        </View>
                        <View style={{ flex: 1.6 }}>
                          {a.sync_status ? (
                            <Text style={syncBadge(a.sync_status)} numberOfLines={1}>{a.sync_status}</Text>
                          ) : <Text style={sd.relatedCell}>Pending</Text>}
                        </View>
                      </View>
                    ))}
                  </>
                ) : (
                  <View style={sd.relatedEmpty}>
                    <Text style={sd.relatedEmptyIcon}>👤</Text>
                    <Text style={sd.relatedEmptyText}>No telecaller assignments yet.</Text>
                    <Text style={sd.relatedEmptyHint}>Click "+ New" to assign a telecaller.</Text>
                  </View>
                )}
              </RelatedSection>

              {/* ── Campaign Hierarchy ────────────────────────────── */}
              {d.parent_campaign_name ? (
                <RelatedSection title="Campaign Hierarchy" color="#2e7d32" count={0}>
                  <View style={sd.hierarchyRow}>
                    <View style={sd.hierarchyIcon}><Text style={{ fontSize: 14 }}>📣</Text></View>
                    <View>
                      <Text style={sd.hierarchyLabel}>Parent Campaign</Text>
                      <Text style={sd.hierarchyValue}>{d.parent_campaign_name}</Text>
                    </View>
                  </View>
                </RelatedSection>
              ) : null}
            </>
          )}

          <View style={[s.btnRow, { margin: 16, marginBottom: 40 }]}>
            <TouchableOpacity style={s.primaryBtn} onPress={openUpdate}>
              <Text style={s.primaryBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.outlineBtn} onPress={() => setView('list')}>
              <Text style={s.outlineBtnText}>Back to List</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ── Modals ───────────────────────────────────────────────── */}
        <AddMemberModal
          visible={memberModal}
          campaignId={d.id}
          onClose={() => setMemberModal(false)}
          onSaved={async () => {
            setMemberModal(false);
            const updated = await getCampaignById(d.id);
            setSelected(updated);
          }}
        />
        <UploadCSVModal
          visible={csvModal}
          campaign={d}
          onClose={() => setCsvModal(false)}
          onSaved={async () => { setCsvModal(false); const updated = await getCampaignById(d.id); setSelected(updated); }}
        />
        <PromotionLeadsCSVModal
          visible={plnCsvModal}
          campaign={d}
          onClose={() => { setPlnCsvModal(false); searchPromotionLeads('', d.id).then(r => setPlnCount(r.length)).catch(() => {}); }}
        />
        <TelecallerAssignmentModal
          visible={tanModal}
          campaign={d}
          onClose={() => setTanModal(false)}
          onSaved={() => { setTanModal(false); refreshAssignments(d.id); }}
        />
        <BatchStatusModal
          visible={batchModal}
          log={batchLog}
          onClose={() => setBatchModal(false)}
        />
        <SyncCTIModal
          visible={syncModal}
          campaign={{ ...d, ...ctiStatus }}
          onClose={() => setSyncModal(false)}
          onStepDone={async () => { await refreshCtiStatus(d.id); }}
        />
        <LeadDetailModal
          visible={leadModal}
          lead={leadDetail}
          onClose={() => { setLeadModal(false); setLeadDetail(null); }}
        />
      </View>
    );
  }

  // ── CREATE / EDIT FORM ─────────────────────────────────────────────
  const isUpdate = view === 'update';
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} keyboardShouldPersistTaps="handled">

        {/* Modal-style header matching the screenshot */}
        <View style={s.formHeader}>
          <View style={s.formHeaderTop}>
            <Text style={s.formHeaderSub}>Campaign</Text>
            <Text style={s.formHeaderTitle}>{isUpdate ? 'Edit Campaign' : 'New Campaign: Bulk Prospect Insert'}</Text>
          </View>
          <TouchableOpacity onPress={() => setView(isUpdate ? 'detail' : 'list')}>
            <Text style={s.formCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.requiredHint}>* = Required Information</Text>

        <SectionHeader title="Campaign Information" />
        <TF label="Campaign Name" value={form.campaign_name} onChange={v => sf('campaign_name', v)} required />
        <TF label="Campaign Owner" value={form.campaign_owner} onChange={v => sf('campaign_owner', v)} />
        <ToggleField label="Active" value={form.active} onChange={v => sf('active', v)} />
        <DropdownPicker label="Status" value={form.status} options={STATUS_OPTIONS} onSelect={v => sf('status', v)} />
        <CampaignLookupField
          label="Parent Campaign"
          value={form.parent_campaign_id}
          displayValue={form.parent_campaign_name}
          onSelect={(id, name) => setForm(p => ({ ...p, parent_campaign_id: id, parent_campaign_name: name }))}
        />
        <DatePickerField label="Start Date" value={form.start_date} onChange={v => sf('start_date', v)} />
        <DropdownPicker label="Type" value={form.type} options={TYPE_OPTIONS} onSelect={v => sf('type', v)} />
        <DatePickerField label="End Date" value={form.end_date} onChange={v => sf('end_date', v)} />
        <TF label="Description" value={form.description} onChange={v => sf('description', v)} multiline />
        <TF label="Source" value={form.source} onChange={v => sf('source', v)} />
        <TF label="No of Call Attempts" value={form.no_of_call_attempts} onChange={v => sf('no_of_call_attempts', v)} keyboardType="numeric" autoCapitalize="none" />

        <SectionHeader title="Planning" />
        <TF label="Num Sent in Campaign" value={form.num_sent} onChange={v => sf('num_sent', v)} keyboardType="numeric" autoCapitalize="none" />
        <TF label="Budgeted Cost in Campaign" value={form.budgeted_cost} onChange={v => sf('budgeted_cost', v)} keyboardType="numeric" autoCapitalize="none" />
        <TF label="Expected Response (%)" value={form.expected_response_pct} onChange={v => sf('expected_response_pct', v)} keyboardType="numeric" autoCapitalize="none" />
        <TF label="Actual Cost in Campaign" value={form.actual_cost} onChange={v => sf('actual_cost', v)} keyboardType="numeric" autoCapitalize="none" />
        <TF label="Expected Revenue in Campaign" value={form.expected_revenue} onChange={v => sf('expected_revenue', v)} keyboardType="numeric" autoCapitalize="none" />

        <View style={[s.btnRow, { marginTop: 20, marginBottom: 40 }]}>
          <TouchableOpacity style={s.primaryBtn} onPress={() => handleSave(isUpdate)} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>{isUpdate ? 'Save' : 'Save'}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.outlineBtn2} onPress={() => setView(isUpdate ? 'detail' : 'list')}>
            <Text style={s.outlineBtn2Text}>Cancel</Text>
          </TouchableOpacity>
          {!isUpdate && (
            <TouchableOpacity style={s.saveNewBtn} onPress={async () => {
              if (!form.campaign_name.trim())
                return Toast.show({ type: 'error', text1: '* Campaign Name is required.' });
              setSaving(true);
              try {
                const result = await createCampaign(form);
                if (result.success) {
                  Toast.show({ type: 'success', text1: 'Campaign created successfully.' });
                  setForm(emptyForm());
                  loadCampaigns('');
                }
              } catch (e) {
                Toast.show({ type: 'error', text1: e.message });
              } finally { setSaving(false); }
            }} disabled={saving}>
              <Text style={s.saveNewBtnText}>Save &amp; New</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Telecaller Assignment Modal ───────────────────────────────────────
const SYNC_STATUS_OPTIONS = ['--None--', 'Pending', 'In Progress', 'Synced', 'Failed'];

function TelecallerAssignmentModal({ visible, campaign, onClose, onSaved }) {
  const [form, setForm] = useState({
    assignment_name: '', telecaller_id: '', telecaller_name: '',
    is_active: false, owner_name: '', message: '', sync_status: '',
  });
  const [saving,         setSaving]         = useState(false);
  const [saveAndNew,     setSaveAndNew]      = useState(false);
  const [userResults,    setUserResults]     = useState([]);
  const [userQuery,      setUserQuery]       = useState('');
  const [userSearchOpen, setUserSearchOpen]  = useState(false);
  const [userLoading,    setUserLoading]     = useState(false);
  const [syncOpen,       setSyncOpen]        = useState(false);

  function resetForm() {
    setForm({ assignment_name: '', telecaller_id: '', telecaller_name: '', is_active: false, owner_name: '', message: '', sync_status: '' });
    setUserQuery(''); setUserResults([]);
  }

  async function searchUsers(q) {
    setUserLoading(true);
    try { setUserResults((await searchTelecallerUsers(q)) || []); }
    catch (_) {}
    finally { setUserLoading(false); }
  }

  function openUserSearch() { setUserQuery(''); searchUsers(''); setUserSearchOpen(true); }

  function selectUser(u) {
    setForm(p => ({ ...p, telecaller_id: u.id, telecaller_name: u.display_name }));
    setUserQuery(u.display_name);
    setUserSearchOpen(false);
  }

  function clearUser() {
    setForm(p => ({ ...p, telecaller_id: '', telecaller_name: '' }));
    setUserQuery('');
  }

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function doSave(keepOpen) {
    keepOpen ? setSaveAndNew(true) : setSaving(true);
    try {
      const payload = {
        ...form,
        campaign_id:   campaign?.id           || '',
        campaign_name: campaign?.campaign_name || '',
      };
      const result = await createTelecallerAssignment(payload);
      if (result.success) {
        Toast.show({ type: 'success', text1: `Telecaller Assignment ${result.tan_number} created.` });
        if (keepOpen) { resetForm(); }
        else { resetForm(); onSaved(); }
      } else {
        Toast.show({ type: 'error', text1: result.error || 'Save failed' });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message });
    } finally { keepOpen ? setSaveAndNew(false) : setSaving(false); }
  }

  function handleClose() { resetForm(); onClose(); }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={tan.backdrop}>
        <View style={tan.card}>
          {/* Header */}
          <View style={tan.header}>
            <Text style={tan.title}>New Telecaller Assignment</Text>
            <TouchableOpacity onPress={handleClose}><Text style={tan.close}>✕</Text></TouchableOpacity>
          </View>
          <Text style={tan.required}>* = Required Information</Text>

          <ScrollView style={tan.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Information section */}
            <View style={tan.section}>
              <Text style={tan.sectionTitle}>Information</Text>
            </View>

            {/* 2-column grid matching SF layout */}
            <View style={tan.grid}>
              {/* Left column */}
              <View style={tan.col}>
                <View style={tan.fieldWrap}>
                  <Text style={tan.label}>Telecaller Assignment Name</Text>
                  <TextInput
                    style={tan.input}
                    value={form.assignment_name}
                    onChangeText={v => sf('assignment_name', v)}
                    placeholder=""
                    placeholderTextColor="#aaa"
                  />
                </View>

                <View style={tan.fieldWrap}>
                  <Text style={tan.label}>Campaign</Text>
                  <View style={tan.lookupBox}>
                    <View style={tan.lookupIconBox}>
                      <Text style={{ fontSize: 14 }}>📣</Text>
                    </View>
                    <Text style={tan.lookupText} numberOfLines={1}>
                      {campaign?.campaign_name || '—'}
                    </Text>
                  </View>
                </View>

                {/* Telecaller lookup — highlighted row like SF */}
                <View style={[tan.fieldWrap, tan.telecallerRow]}>
                  <Text style={tan.label}>Telecaller</Text>
                  {form.telecaller_id ? (
                    <View style={tan.lookupBox}>
                      <View style={tan.lookupIconBox}>
                        <Text style={{ fontSize: 14 }}>👤</Text>
                      </View>
                      <Text style={tan.lookupText} numberOfLines={1}>{form.telecaller_name}</Text>
                      <TouchableOpacity onPress={clearUser} style={tan.lookupClear}>
                        <Text style={{ color: '#706e6b', fontSize: 16 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={tan.lookupEmpty} onPress={openUserSearch}>
                      <Text style={tan.lookupEmptyText}>Search Telecaller...</Text>
                    </TouchableOpacity>
                  )}
                  {/* Undo icon like in SF */}
                  <TouchableOpacity style={tan.undoBtn} onPress={clearUser}>
                    <Text style={tan.undoBtnText}>↩</Text>
                  </TouchableOpacity>
                </View>

                <View style={tan.toggleRow}>
                  <Text style={tan.label}>isActive</Text>
                  <Switch
                    value={!!form.is_active}
                    onValueChange={v => sf('is_active', v)}
                    trackColor={{ false: '#d8dde6', true: '#0070d2' }}
                    thumbColor="#fff"
                    style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                  />
                </View>
              </View>

              {/* Right column */}
              <View style={tan.col}>
                <View style={tan.fieldWrap}>
                  <Text style={tan.label}>Owner</Text>
                  <TextInput
                    style={tan.input}
                    value={form.owner_name}
                    onChangeText={v => sf('owner_name', v)}
                    placeholder=""
                    placeholderTextColor="#aaa"
                  />
                </View>

                <View style={tan.fieldWrap}>
                  <Text style={tan.label}>Message</Text>
                  <TextInput
                    style={[tan.input, tan.textarea]}
                    value={form.message}
                    onChangeText={v => sf('message', v)}
                    multiline
                    textAlignVertical="top"
                    placeholderTextColor="#aaa"
                  />
                </View>

                {/* Sync Status dropdown */}
                <View style={tan.fieldWrap}>
                  <Text style={tan.label}>Sync Status</Text>
                  <TouchableOpacity style={tan.dropdown} onPress={() => setSyncOpen(true)}>
                    <Text style={[tan.dropdownText, !form.sync_status && { color: '#aaa' }]}>
                      {form.sync_status || '--None--'}
                    </Text>
                    <Text style={tan.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer buttons */}
          <View style={tan.footer}>
            <TouchableOpacity style={tan.cancelBtn} onPress={handleClose}>
              <Text style={tan.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={tan.saveNewBtn} onPress={() => doSave(true)} disabled={saveAndNew || saving}>
              {saveAndNew ? <ActivityIndicator color="#0070d2" size="small" /> : <Text style={tan.saveNewBtnText}>Save &amp; New</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={tan.saveBtn} onPress={() => doSave(false)} disabled={saving || saveAndNew}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={tan.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* User search modal */}
        <Modal visible={userSearchOpen} transparent animationType="slide" onRequestClose={() => setUserSearchOpen(false)}>
          <View style={tan.userBackdrop}>
            <View style={tan.userCard}>
              <View style={tan.userHeader}>
                <Text style={tan.userTitle}>Select Telecaller</Text>
                <TouchableOpacity onPress={() => setUserSearchOpen(false)}><Text style={tan.close}>✕</Text></TouchableOpacity>
              </View>
              <View style={tan.userSearch}>
                <TextInput
                  style={tan.userSearchInput}
                  placeholder="Search by name, DSA code..."
                  value={userQuery}
                  onChangeText={q => { setUserQuery(q); searchUsers(q); }}
                  placeholderTextColor="#aaa"
                  autoCapitalize="none"
                />
              </View>
              {userLoading ? <ActivityIndicator style={{ margin: 20 }} /> : (
                <FlatList
                  data={userResults}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={tan.userItem} onPress={() => selectUser(item)}>
                      <View style={tan.userItemIcon}><Text style={{ fontSize: 14 }}>👤</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={tan.userItemName}>{item.display_name}</Text>
                        {item.email ? <Text style={tan.userItemSub}>{item.email}</Text> : null}
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={<Text style={tan.userEmpty}>No users found</Text>}
                />
              )}
            </View>
          </View>
        </Modal>

        {/* Sync Status picker */}
        <Modal visible={syncOpen} transparent animationType="fade" onRequestClose={() => setSyncOpen(false)}>
          <TouchableOpacity style={tan.pickerOverlay} activeOpacity={1} onPress={() => setSyncOpen(false)}>
            <View style={tan.pickerBox}>
              <FlatList
                data={SYNC_STATUS_OPTIONS}
                keyExtractor={i => i}
                renderItem={({ item }) => (
                  <TouchableOpacity style={tan.pickerItem} onPress={() => { sf('sync_status', item === '--None--' ? '' : item); setSyncOpen(false); }}>
                    <Text style={[tan.pickerItemText, item === (form.sync_status || '--None--') && { color: '#0070d2', fontWeight: '700' }]}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </Modal>
  );
}

// ── Upload CSV Modal — Standard Campaign Members (Lead + Campaign Member) ──
function UploadCSVModal({ visible, campaign, onClose, onSaved }) {
  const [fileName,  setFileName]  = useState('');
  const [records,   setRecords]   = useState([]);
  const [uploading, setUploading] = useState(false);
  const [result,    setResult]    = useState(null);

  const CSV_HEADERS = 'First Name,Last Name,Email,Mobile,Phone,Company,Lead Source,Member Status';
  const SAMPLE_ROW  = 'John,Doe,john@example.com,9876543210,022-12345678,Times Group,Web,Sent';

  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    return lines.slice(1).filter(l => l.trim()).map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (values[i] || '').trim(); });
      return obj;
    });
  }

  function pickFile() {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = '.csv,text/csv';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFileName(file.name);
        setRecords(parseCSV(await file.text()));
        setResult(null);
      };
      input.click();
    } else {
      Alert.alert('Info', 'File picker is available on web only in this version.');
    }
  }

  function downloadSample() {
    if (Platform.OS === 'web') {
      const blob = new Blob([CSV_HEADERS + '\n' + SAMPLE_ROW + '\n'], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'campaign_members_sample.csv'; a.click();
      URL.revokeObjectURL(url);
    }
  }

  async function handleUpload() {
    if (!records.length) return Toast.show({ type: 'error', text1: 'No records to upload. Select a CSV file first.' });
    setUploading(true); setResult(null);
    try {
      const res = await bulkAddCampaignMembers({
        campaign_id: campaign?.id || '',
        records,
      });
      setResult(res);
      if (res.inserted > 0) {
        Toast.show({ type: 'success', text1: `${res.inserted} of ${res.total} member(s) added.` });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message });
    } finally { setUploading(false); }
  }

  function handleClose() { setFileName(''); setRecords([]); setResult(null); onClose(); }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={csv.backdrop}>
        <View style={csv.card}>
          <View style={csv.header}>
            <View>
              <Text style={csv.title}>Upload Campaign Members</Text>
              <Text style={csv.subtitle}>Creates Lead + Campaign Member for each row</Text>
            </View>
            <TouchableOpacity onPress={handleClose}><Text style={csv.close}>✕</Text></TouchableOpacity>
          </View>

          <ScrollView style={csv.body} showsVerticalScrollIndicator={false}>
            <View style={csv.uploadArea}>
              <TouchableOpacity style={csv.uploadBtn} onPress={handleUpload} disabled={uploading || !records.length}>
                {uploading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={csv.uploadBtnText}>⬆ Upload Records</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={csv.fileBtn} onPress={pickFile}>
                <Text style={csv.fileBtnText}>Choose File</Text>
              </TouchableOpacity>
              <TouchableOpacity style={csv.downloadBtn} onPress={downloadSample}>
                <Text style={csv.downloadBtnText}>⬇</Text>
              </TouchableOpacity>
            </View>

            <Text style={csv.fileName}>
              {fileName ? `📄 ${fileName}  (${records.length} rows)` : 'No File Selected..'}
            </Text>

            {result && (
              <View style={csv.resultSection}>
                <View style={[csv.resultSummary, result.inserted > 0 ? csv.resultSummarySuccess : csv.resultSummaryError]}>
                  <Text style={csv.resultSummaryText}>
                    ✓ {result.inserted} of {result.total} records inserted successfully
                    {result.failed?.length > 0 ? `  •  ${result.failed.length} failed` : ''}
                  </Text>
                </View>
                {result.failed?.length > 0 && (
                  <View style={csv.failedTable}>
                    <Text style={csv.failedTitle}>Failed Records:</Text>
                    <View style={csv.failedHead}>
                      <Text style={[csv.failedTH, { flex: 0.5 }]}>ROW</Text>
                      <Text style={[csv.failedTH, { flex: 1.5 }]}>NAME</Text>
                      <Text style={[csv.failedTH, { flex: 3 }]}>REASON</Text>
                    </View>
                    {result.failed.map((f, i) => (
                      <View key={i} style={csv.failedRow}>
                        <Text style={[csv.failedCell, { flex: 0.5 }]}>{f.row}</Text>
                        <Text style={[csv.failedCell, { flex: 1.5 }]} numberOfLines={1}>{f.name}</Text>
                        <Text style={[csv.failedCellRed, { flex: 3 }]} numberOfLines={2}>{f.reason}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={csv.instructions}>
              <Text style={csv.instrTitle}>Instructions:</Text>
              <Text style={csv.instrItem}>1. Download sample CSV format using ⬇ button.</Text>
              <Text style={csv.instrItem}>2. Fill in data: Last Name is required for each row.</Text>
              <Text style={[csv.instrItem, { color: '#e74c3c' }]}>3. Mobile must be 10 digits.</Text>
              <Text style={[csv.instrItem, { color: '#e67e22' }]}>4. Each row creates a Lead and links it as a Campaign Member.</Text>
            </View>
            <Text style={csv.csvFields}>CSV Columns: {CSV_HEADERS}</Text>
          </ScrollView>

          <View style={csv.footer}>
            <TouchableOpacity style={csv.cancelBtn} onPress={handleClose}>
              <Text style={csv.cancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Promotion Leads CSV Modal — Custom Campaign Process ───────────────
function PromotionLeadsCSVModal({ visible, campaign, onClose }) {
  const [fileName,  setFileName]  = useState('');
  const [records,   setRecords]   = useState([]);
  const [uploading, setUploading] = useState(false);
  const [result,    setResult]    = useState(null);

  const CSV_HEADERS = 'Branch Code,Sales Office,Sales Group Code,Prospect Name,Address,Mobile Number,Landline Number,DSA Code,Depot Code,Locality Code,Dealer Code,Vendor Code,Email,Pincode,Alternate Mobile Number,Source Of Data,Is Bypass Validation,Business Type';
  const SAMPLE_ROW  = 'BLR001,South Office,SG01,John Doe,123 Main St,9876543210,080-12345678,DSA001,DEPOT01,LOC001,DLR01,VND01,john@example.com,560001,9876543211,Online,No,Newspaper';

  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    return lines.slice(1).filter(l => l.trim()).map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (values[i] || '').trim(); });
      return obj;
    });
  }

  function pickFile() {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = '.csv,text/csv';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFileName(file.name);
        setRecords(parseCSV(await file.text()));
        setResult(null);
      };
      input.click();
    } else {
      Alert.alert('Info', 'File picker available on web only.');
    }
  }

  function downloadSample() {
    if (Platform.OS === 'web') {
      const blob = new Blob([CSV_HEADERS + '\n' + SAMPLE_ROW + '\n'], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'promotion_leads_sample.csv'; a.click();
      URL.revokeObjectURL(url);
    }
  }

  async function handleUpload() {
    if (!records.length) return Toast.show({ type: 'error', text1: 'No records to upload. Select a CSV file first.' });
    setUploading(true); setResult(null);
    try {
      const res = await bulkInsertPromotionLeads({
        records,
        campaign_id:   campaign?.id            || '',
        campaign_name: campaign?.campaign_name || '',
      });
      setResult(res);
      if (res.inserted > 0) Toast.show({ type: 'success', text1: `${res.inserted} promotion lead(s) inserted.` });
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message });
    } finally { setUploading(false); }
  }

  function handleClose() { setFileName(''); setRecords([]); setResult(null); onClose(); }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={csv.backdrop}>
        <View style={csv.card}>
          <View style={csv.header}>
            <View>
              <Text style={csv.title}>Upload Promotion Leads</Text>
              <Text style={csv.subtitle}>Custom Campaign — Bulk import prospect data</Text>
            </View>
            <TouchableOpacity onPress={handleClose}><Text style={csv.close}>✕</Text></TouchableOpacity>
          </View>

          <ScrollView style={csv.body} showsVerticalScrollIndicator={false}>
            <View style={csv.uploadArea}>
              <TouchableOpacity style={csv.uploadBtn} onPress={handleUpload} disabled={uploading || !records.length}>
                {uploading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={csv.uploadBtnText}>⬆ Upload Records</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={csv.fileBtn} onPress={pickFile}>
                <Text style={csv.fileBtnText}>Choose File</Text>
              </TouchableOpacity>
              <TouchableOpacity style={csv.downloadBtn} onPress={downloadSample}>
                <Text style={csv.downloadBtnText}>⬇</Text>
              </TouchableOpacity>
            </View>

            <Text style={csv.fileName}>
              {fileName ? `📄 ${fileName}  (${records.length} rows)` : 'No File Selected..'}
            </Text>

            {result && (
              <View style={[csv.resultBox, result.inserted > 0 ? csv.resultSuccess : csv.resultError]}>
                <Text style={csv.resultText}>✓ {result.inserted} record(s) inserted successfully.</Text>
                {result.errors?.length > 0 && <Text style={csv.resultErrorText}>{result.errors.join('\n')}</Text>}
              </View>
            )}

            <View style={csv.instructions}>
              <Text style={csv.instrTitle}>Instructions:</Text>
              <Text style={csv.instrItem}>1. Upload CSV File with Pre Prospect Data.</Text>
              <Text style={csv.instrItem}>2. Click ⬇ to Download Sample Format.</Text>
              <Text style={[csv.instrItem, { color: '#e74c3c' }]}>3. Mobile Number must be 10 digits.</Text>
            </View>
            <Text style={csv.csvFields}>CSV Columns: {CSV_HEADERS}</Text>
          </ScrollView>

          <View style={csv.footer}>
            <TouchableOpacity style={csv.cancelBtn} onPress={handleClose}>
              <Text style={csv.cancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Add Member Modal — Creates Lead first, then Campaign Member ───────
function AddMemberModal({ visible, campaignId, onClose, onSaved }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', mobile: '', phone: '', company: '', lead_source: '', status: 'Sent',
  });
  const [saving, setSaving] = useState(false);
  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));

  function resetForm() {
    setForm({ first_name: '', last_name: '', email: '', mobile: '', phone: '', company: '', lead_source: '', status: 'Sent' });
  }

  async function handleAdd() {
    if (!form.last_name.trim()) return Toast.show({ type: 'error', text1: '* Last Name is required' });
    if (!form.company.trim())   return Toast.show({ type: 'error', text1: '* Company is required' });
    if (form.mobile && !/^\d{10}$/.test(form.mobile.replace(/[\s\-]/g, '')))
      return Toast.show({ type: 'error', text1: 'Mobile must be 10 digits' });
    setSaving(true);
    try {
      await addCampaignMemberWithLead({ campaign_id: campaignId, ...form });
      Toast.show({ type: 'success', text1: 'Lead created and added as Campaign Member.' });
      resetForm();
      onSaved();
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message });
    } finally { setSaving(false); }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={mb.backdrop}>
        <View style={mb.card}>
          <View style={mb.header}>
            <View>
              <Text style={mb.title}>Add Campaign Member</Text>
              <Text style={mb.subtitle}>A Lead will be created and linked</Text>
            </View>
            <TouchableOpacity onPress={onClose}><Text style={mb.close}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={mb.body} keyboardShouldPersistTaps="handled">
            <TF label="First Name"   value={form.first_name}  onChange={v => sf('first_name', v)} />
            <TF label="Last Name"    value={form.last_name}   onChange={v => sf('last_name', v)}  required />
            <TF label="Mobile"       value={form.mobile}      onChange={v => sf('mobile', v)}      keyboardType="phone-pad" autoCapitalize="none" />
            <TF label="Email"        value={form.email}       onChange={v => sf('email', v)}       keyboardType="email-address" autoCapitalize="none" />
            <TF label="Phone"        value={form.phone}       onChange={v => sf('phone', v)}       keyboardType="phone-pad" autoCapitalize="none" />
            <TF label="Company"      value={form.company}     onChange={v => sf('company', v)} required />
            <TF label="Lead Source"  value={form.lead_source} onChange={v => sf('lead_source', v)} />
            <DropdownPicker label="Member Status" value={form.status} options={MEMBER_STATUS} onSelect={v => sf('status', v)} />
          </ScrollView>
          <View style={mb.footer}>
            <TouchableOpacity style={s.outlineBtn} onPress={onClose}><Text style={s.outlineBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={s.primaryBtn} onPress={handleAdd} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Add Member</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Batch Status Modal ────────────────────────────────────────────────
function BatchStatusModal({ visible, log, onClose }) {
  if (!log) return null;
  const isRunning = log.status === 'running';
  const statusColor = { running: '#856404', completed: '#1a7431', failed: '#c0392b' };
  const statusBg    = { running: '#fff3cd', completed: '#d4edda', failed: '#fce8e6' };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={bst.backdrop}>
        <View style={bst.card}>
          <View style={bst.header}>
            <Text style={bst.title}>💬 Call Batch Status</Text>
            <TouchableOpacity onPress={onClose}><Text style={bst.close}>✕</Text></TouchableOpacity>
          </View>

          <View style={bst.body}>
            {/* Status badge */}
            <View style={[bst.statusBadge, { backgroundColor: statusBg[log.status] || '#f0f0f0' }]}>
              {isRunning && <ActivityIndicator size="small" color="#856404" style={{ marginRight: 8 }} />}
              <Text style={[bst.statusText, { color: statusColor[log.status] || '#444' }]}>
                {isRunning ? 'Processing...' : log.status === 'completed' ? '✓ Completed' : '✕ Failed'}
              </Text>
            </View>

            {/* Stats grid */}
            <View style={bst.statsGrid}>
              <StatBox label="Total Records" value={log.total ?? 0} color="#16325c" />
              <StatBox label="WhatsApp Sent" value={log.sent_wa ?? 0} color="#25d366" icon="💬" />
              <StatBox label="SMS Sent"      value={log.sent_sms ?? 0} color="#0070d2" icon="📱" />
              <StatBox label="Email Sent"    value={log.sent_email ?? 0} color="#c0392b" icon="✉️" />
              <StatBox label="Failed"        value={log.failed_count ?? 0} color="#e67e22" icon="⚠️" />
            </View>

            {/* Error summary */}
            {!!log.error_summary && (
              <View style={bst.errorBox}>
                <Text style={bst.errorTitle}>Errors / Warnings:</Text>
                <ScrollView style={{ maxHeight: 120 }}>
                  <Text style={bst.errorText}>{log.error_summary}</Text>
                </ScrollView>
              </View>
            )}

            {isRunning && (
              <Text style={bst.hint}>Auto-refreshing every 3 seconds...</Text>
            )}
          </View>

          <View style={bst.footer}>
            <TouchableOpacity style={bst.closeBtn} onPress={onClose}>
              <Text style={bst.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function StatBox({ label, value, color, icon }) {
  return (
    <View style={bst.statBox}>
      <Text style={bst.statIcon}>{icon || ''}</Text>
      <Text style={[bst.statValue, { color }]}>{value}</Text>
      <Text style={bst.statLabel}>{label}</Text>
    </View>
  );
}

// ── Sync CTI Modal — 3-step Ameyo sync flow ───────────────────────────
function SyncCTIModal({ visible, campaign, onClose, onStepDone }) {
  const [step1Loading, setStep1Loading] = useState(false);
  const [step2Loading, setStep2Loading] = useState(false);
  const [step3Loading, setStep3Loading] = useState(false);

  async function runStep(setter, apiFn, ...args) {
    setter(true);
    try {
      const res = await apiFn(...args);
      Toast.show({ type: res.success ? 'success' : 'error', text1: res.message || res.error || 'Done' });
      if (onStepDone) await onStepDone();
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message });
    } finally { setter(false); }
  }

  const s1Done = ['Campaign Sync Success','Telecallers Sync Success','Campaign Members Sync Success','Campaign Members Sync Initiated'].includes(campaign?.cti_sync_status);
  const s2Done = ['Telecallers Sync Success','Campaign Members Sync Success','Campaign Members Sync Initiated'].includes(campaign?.cti_sync_status);
  const s3Done = ['Campaign Members Sync Success'].includes(campaign?.cti_sync_status);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={syn.backdrop}>
        <View style={syn.card}>
          <View style={syn.header}>
            <Text style={syn.title}>🔄  Sync Campaign to CTI (Ameyo)</Text>
            <TouchableOpacity onPress={onClose}><Text style={syn.close}>✕</Text></TouchableOpacity>
          </View>

          <ScrollView style={syn.body} showsVerticalScrollIndicator={false}>
            <Text style={syn.intro}>
              Run all three steps in order to fully sync this campaign with Ameyo dialler.
            </Text>

            {/* Step 1 */}
            <View style={syn.stepCard}>
              <View style={syn.stepHeader}>
                <View style={[syn.stepBadge, s1Done && syn.stepBadgeDone]}>
                  <Text style={syn.stepNum}>{s1Done ? '✓' : '1'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={syn.stepTitle}>Sync Campaign</Text>
                  <Text style={syn.stepDesc}>Creates a Lead Table in Ameyo for this campaign.</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[syn.stepBtn, s1Done && syn.stepBtnDone, step1Loading && syn.stepBtnLoading]}
                onPress={() => runStep(setStep1Loading, syncCampaign, campaign?.id)}
                disabled={step1Loading}
              >
                {step1Loading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={syn.stepBtnText}>{s1Done ? 'Re-Sync Campaign' : 'Run Step 1'}</Text>}
              </TouchableOpacity>
            </View>

            {/* Step 2 */}
            <View style={[syn.stepCard, !s1Done && syn.stepCardDisabled]}>
              <View style={syn.stepHeader}>
                <View style={[syn.stepBadge, s2Done && syn.stepBadgeDone, !s1Done && syn.stepBadgeOff]}>
                  <Text style={syn.stepNum}>{s2Done ? '✓' : '2'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={syn.stepTitle}>Sync Telecallers</Text>
                  <Text style={syn.stepDesc}>Maps assigned telecallers to the campaign in Ameyo.</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[syn.stepBtn, s2Done && syn.stepBtnDone, (!s1Done || step2Loading) && syn.stepBtnLoading]}
                onPress={() => runStep(setStep2Loading, syncTelecallers, campaign?.id)}
                disabled={!s1Done || step2Loading}
              >
                {step2Loading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={syn.stepBtnText}>{s2Done ? 'Re-Sync Telecallers' : 'Run Step 2'}</Text>}
              </TouchableOpacity>
            </View>

            {/* Step 3 */}
            <View style={[syn.stepCard, !s1Done && syn.stepCardDisabled]}>
              <View style={syn.stepHeader}>
                <View style={[syn.stepBadge, s3Done && syn.stepBadgeDone, !s1Done && syn.stepBadgeOff]}>
                  <Text style={syn.stepNum}>{s3Done ? '✓' : '3'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={syn.stepTitle}>Sync Campaign Members</Text>
                  <Text style={syn.stepDesc}>Pushes all campaign members as customer records to Ameyo dialler.</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[syn.stepBtn, s3Done && syn.stepBtnDone, (!s1Done || step3Loading) && syn.stepBtnLoading]}
                onPress={() => runStep(setStep3Loading, syncCampaignMembers, campaign?.id)}
                disabled={!s1Done || step3Loading}
              >
                {step3Loading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={syn.stepBtnText}>{s3Done ? 'Re-Sync Members' : 'Run Step 3'}</Text>}
              </TouchableOpacity>
            </View>

            {campaign?.cti_sync_status ? (
              <View style={syn.statusRow}>
                <Text style={syn.statusLabel}>Current Status:</Text>
                <Text style={syn.statusValue}>{campaign.cti_sync_status}</Text>
              </View>
            ) : null}
            {campaign?.cti_error_reason ? (
              <View style={syn.errorBox}>
                <Text style={syn.errorText}>{campaign.cti_error_reason}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={syn.footer}>
            <TouchableOpacity style={syn.closeBtn} onPress={onClose}>
              <Text style={syn.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Lead Detail Modal — opens when tapping a Campaign Member ─────────
function LeadDetailModal({ visible, lead, onClose }) {
  if (!lead) return null;
  const name = [lead.salutation, lead.first_name, lead.last_name].filter(Boolean).join(' ');

  function Row({ label, value }) {
    if (!value) return null;
    return (
      <View style={ld.row}>
        <Text style={ld.label}>{label}</Text>
        <Text style={ld.value}>{String(value)}</Text>
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={ld.backdrop}>
        <View style={ld.card}>
          {/* Header */}
          <View style={ld.header}>
            <View style={ld.avatar}>
              <Text style={ld.avatarText}>{(lead.first_name || lead.last_name || 'L')[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ld.recordType}>Lead</Text>
              <Text style={ld.name} numberOfLines={2}>{name || '—'}</Text>
              {lead.lead_status ? (
                <View style={{ flexDirection: 'row', marginTop: 4 }}>
                  <Text style={leadStatusBadge(lead.lead_status)}>{lead.lead_status}</Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity onPress={onClose} style={ld.closeBtn}>
              <Text style={ld.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={ld.body} showsVerticalScrollIndicator={false}>
            {/* Contact Info */}
            <View style={ld.section}>
              <Text style={ld.sectionTitle}>Contact Information</Text>
              <Row label="Mobile"           value={lead.mobile} />
              <Row label="Alternate Mobile" value={lead.alternate_mobile} />
              <Row label="Phone"            value={lead.phone} />
              <Row label="Email"            value={lead.email} />
            </View>

            {/* Personal Info */}
            <View style={ld.section}>
              <Text style={ld.sectionTitle}>Personal Details</Text>
              <Row label="Gender"       value={lead.gender} />
              <Row label="Birth Date"   value={lead.birth_date ? String(lead.birth_date).slice(0, 10) : null} />
              <Row label="Age Group"    value={lead.age_group} />
              <Row label="Occupation"   value={lead.occupation} />
              <Row label="Income Range" value={lead.income_range} />
              <Row label="Education"    value={lead.education} />
            </View>

            {/* Address */}
            <View style={ld.section}>
              <Text style={ld.sectionTitle}>Address</Text>
              <Row label="Address"      value={lead.address} />
              <Row label="Locality"     value={lead.locality_name} />
              <Row label="City"         value={lead.city} />
              <Row label="State"        value={lead.state} />
              <Row label="Pincode"      value={lead.pincode} />
            </View>

            {/* Business */}
            <View style={ld.section}>
              <Text style={ld.sectionTitle}>Business</Text>
              <Row label="Company"      value={lead.company} />
              <Row label="Lead Source"  value={lead.lead_source} />
              <Row label="Branch Code"  value={lead.branch_code} />
              <Row label="Depot Code"   value={lead.depot_code} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Sub-components ───────────────────────────────────────────────────
function QuickItem({ label, value }) {
  if (!value) return null;
  return (
    <View style={sd.quickItem}>
      <Text style={sd.quickLabel}>{label}</Text>
      <Text style={sd.quickValue}>{value}</Text>
    </View>
  );
}

function StatusPill({ value }) {
  const COLORS = {
    'Planned':     { bg: '#e8f4fd', text: '#0070d2' },
    'In Progress': { bg: '#fff3cd', text: '#856404' },
    'Completed':   { bg: '#d4edda', text: '#1a7431' },
    'Aborted':     { bg: '#fce8e6', text: '#c0392b' },
  };
  const c = COLORS[value] || { bg: '#f0f0f0', text: '#444' };
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginRight: 8 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: c.text }}>{value}</Text>
    </View>
  );
}

function memberStatusBadge(status) {
  const COLORS = { 'Sent': '#0070d2', 'Responded': '#1a7431', 'Opted Out': '#c0392b', 'Attended': '#1a7431' };
  const col = COLORS[status] || '#706e6b';
  return { fontSize: 10, fontWeight: '700', color: col, borderWidth: 1, borderColor: col, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2, alignSelf: 'flex-start' };
}

function syncBadge(status) {
  const SUCCESS = ['Synced', 'Campaign Sync Success', 'Telecallers Sync Success', 'Campaign Members Sync Success'];
  const FAIL    = ['Failed', 'Campaign Sync Failed', 'Telecallers Sync Failed', 'Campaign Members Sync Failed'];
  const bg  = SUCCESS.includes(status) ? '#d4edda' : FAIL.includes(status) ? '#fce8e6' : '#fff3cd';
  const col = SUCCESS.includes(status) ? '#1a7431' : FAIL.includes(status) ? '#c0392b' : '#856404';
  return { fontSize: 9, fontWeight: '700', color: col, backgroundColor: bg, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 2, alignSelf: 'flex-start', overflow: 'hidden' };
}

function leadStatusBadge(status) {
  const MAP = { 'New': '#0070d2', 'Contacted': '#856404', 'Converted': '#1a7431', 'Dead': '#c0392b' };
  const col = MAP[status] || '#444';
  return { fontSize: 11, fontWeight: '700', color: '#fff', backgroundColor: col, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 };
}

function SFSection({ title, children, onEdit }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <View style={sd.section}>
      <TouchableOpacity style={sd.sectionHeader} onPress={() => setCollapsed(c => !c)} activeOpacity={0.8}>
        <Text style={sd.sectionChevron}>{collapsed ? '›' : '∨'}</Text>
        <Text style={sd.sectionTitle}>{title}</Text>
      </TouchableOpacity>
      {!collapsed && <View style={sd.sectionBody}>{children}</View>}
    </View>
  );
}

function SFRow({ L, LV, R, RV, onEdit }) {
  return (
    <View style={sd.sfRow}>
      <View style={sd.sfCell}>
        <Text style={sd.sfCellLabel}>{L}</Text>
        <View style={sd.sfCellValueRow}>
          <Text style={sd.sfCellValue} numberOfLines={2}>{LV || ''}</Text>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={sd.sfEditIcon}>✎</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {!!R && (
        <View style={[sd.sfCell, { borderLeftWidth: 1, borderLeftColor: '#e8ecf0', paddingLeft: 12 }]}>
          <Text style={sd.sfCellLabel}>{R}</Text>
          <View style={sd.sfCellValueRow}>
            <Text style={sd.sfCellValue} numberOfLines={2}>{RV || ''}</Text>
            {onEdit && (
              <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={sd.sfEditIcon}>✎</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function RelatedSection({ title, color, count, onNew, hint, children }) {
  return (
    <View style={sd.relatedSection}>
      <View style={sd.relatedHeader}>
        <View style={[sd.relatedIconBox, { backgroundColor: color }]}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>📋</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={sd.relatedTitle}>{title} ({count})</Text>
          {hint ? <Text style={sd.relatedHint}>{hint}</Text> : null}
        </View>
        {onNew && (
          <TouchableOpacity style={sd.relatedNewBtn} onPress={onNew}>
            <Text style={sd.relatedNewBtnText}>+ New</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────
function formatDate(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d)) return String(val).slice(0, 10);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function formatCurrency(val) {
  if (val == null || val === '') return '';
  return Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_COLORS = {
  'Planned':     { bg: '#e8f4fd', text: '#0070d2' },
  'In Progress': { bg: '#fff3cd', text: '#856404' },
  'Completed':   { bg: '#d4edda', text: '#1a7431' },
  'Aborted':     { bg: '#fce8e6', text: '#c0392b' },
};
function statusBadgeStyle(status) {
  const c = STATUS_COLORS[status] || { bg: '#f0f0f0', text: '#444' };
  return { fontSize: 11, fontWeight: '600', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: c.bg, color: c.text, alignSelf: 'flex-start' };
}

// ── Styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#fff', padding: 16 },
  listHeader:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  searchRow:     { flex: 1, flexDirection: 'row', borderWidth: 1, borderColor: '#d8dde6', borderRadius: 4, overflow: 'hidden' },
  searchInput:   { flex: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#16325c' },
  searchBtn:     { backgroundColor: '#0070d2', paddingHorizontal: 14, justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  newBtn:        { backgroundColor: '#0070d2', borderRadius: 4, paddingHorizontal: 16, paddingVertical: 10 },
  newBtnText:    { color: '#fff', fontSize: 13, fontWeight: '700' },
  listSubtitle:  { fontSize: 12, color: '#706e6b', marginBottom: 8 },
  tableHeader:   { flexDirection: 'row', backgroundColor: '#f4f6f9', paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 2, borderBottomColor: '#d8dde6' },
  th:            { fontSize: 11, fontWeight: '700', color: '#444', textTransform: 'uppercase' },
  tableRow:      { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center' },
  tdLink:        { fontSize: 13, color: '#0070d2', fontWeight: '600' },
  td:            { fontSize: 13, color: '#16325c' },
  emptyBox:      { alignItems: 'center', paddingTop: 40 },
  emptyIcon:     { fontSize: 40, marginBottom: 10 },
  emptyText:     { fontSize: 14, color: '#706e6b' },
  btnRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  primaryBtn:    { backgroundColor: '#0070d2', borderRadius: 4, paddingHorizontal: 24, paddingVertical: 10 },
  primaryBtnText:{ color: '#fff', fontWeight: '700', fontSize: 14 },
  outlineBtn:    { borderWidth: 1, borderColor: '#0070d2', borderRadius: 4, paddingHorizontal: 14, paddingVertical: 8 },
  outlineBtnText:{ color: '#0070d2', fontSize: 13, fontWeight: '600' },
  outlineBtn2:   { borderWidth: 1, borderColor: '#5c5c5c', borderRadius: 4, paddingHorizontal: 14, paddingVertical: 8 },
  outlineBtn2Text:{ color: '#5c5c5c', fontSize: 13, fontWeight: '600' },
  saveNewBtn:    { borderWidth: 1, borderColor: '#0070d2', borderRadius: 4, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#f0f7ff' },
  saveNewBtnText:{ color: '#0070d2', fontSize: 13, fontWeight: '600' },
  formHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e8ecf0' },
  formHeaderTop: { flex: 1 },
  formHeaderSub: { fontSize: 12, color: '#706e6b', marginBottom: 2 },
  formHeaderTitle:{ fontSize: 17, fontWeight: '700', color: '#16325c' },
  formCloseText: { fontSize: 20, color: '#706e6b', padding: 4, marginLeft: 10 },
  requiredHint:  { fontSize: 12, color: '#c0392b', textAlign: 'right', marginBottom: 8 },
});

const sd = StyleSheet.create({
  // Header
  headerCard:       { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e8ecf0', elevation: 2 },
  headerTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerMeta:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  backChip:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f7ff', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  backChipText:     { fontSize: 12, color: '#0070d2', fontWeight: '600' },
  iconBox:          { width: 44, height: 44, borderRadius: 10, backgroundColor: '#d44280', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iconText:         { fontSize: 22 },
  recordLabel:      { fontSize: 11, color: '#706e6b', marginBottom: 2 },
  recordName:       { fontSize: 18, fontWeight: '700', color: '#16325c', lineHeight: 24 },
  editBtn:          { borderWidth: 1.5, borderColor: '#0070d2', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6 },
  editBtnText:      { fontSize: 13, fontWeight: '600', color: '#0070d2' },
  quickBar:         { flexDirection: 'row', flexWrap: 'wrap', gap: 14, alignItems: 'center' },
  quickItem:        { minWidth: 70 },
  quickLabel:       { fontSize: 10, color: '#706e6b', marginBottom: 1, textTransform: 'uppercase' },
  quickValue:       { fontSize: 13, fontWeight: '600', color: '#16325c' },
  // CTI status bar
  ctiBar:           { marginTop: 8, borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctiBarText:       { fontSize: 11, fontWeight: '700' },
  ctiBarError:      { flex: 1, fontSize: 10, color: '#c0392b' },
  // Tab bar
  tabBar:           { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e8ecf0' },
  tabBtn:           { paddingHorizontal: 20, paddingVertical: 12, position: 'relative', alignItems: 'center' },
  tabLabel:         { fontSize: 14, fontWeight: '500', color: '#706e6b' },
  tabLabelActive:   { color: '#0070d2', fontWeight: '700' },
  tabUnderline:     { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: '#0070d2', borderRadius: 2 },
  // SFSection
  section:          { backgroundColor: '#fff', marginTop: 10, marginHorizontal: 10, borderRadius: 8, overflow: 'hidden', elevation: 1, borderWidth: 1, borderColor: '#e8ecf0' },
  sectionHeader:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f6f9', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e8ecf0' },
  sectionChevron:   { fontSize: 15, color: '#706e6b', marginRight: 8, width: 16 },
  sectionTitle:     { fontSize: 13, fontWeight: '700', color: '#16325c' },
  sectionBody:      {},
  sfRow:            { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f0f2f5' },
  sfCell:           { flex: 1, paddingHorizontal: 14, paddingVertical: 10 },
  sfCellLabel:      { fontSize: 11, color: '#706e6b', marginBottom: 3, textTransform: 'uppercase' },
  sfCellValueRow:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  sfCellValue:      { flex: 1, fontSize: 13, color: '#16325c', fontWeight: '500' },
  sfEditIcon:       { fontSize: 14, color: '#c0c0c0', marginLeft: 4 },
  // Related sections
  relatedSection:   { backgroundColor: '#fff', margin: 10, borderRadius: 8, overflow: 'hidden', elevation: 1, borderWidth: 1, borderColor: '#e8ecf0' },
  relatedHeader:    { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e8ecf0', backgroundColor: '#f4f6f9' },
  relatedIconBox:   { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  relatedTitle:     { fontSize: 14, fontWeight: '700', color: '#16325c' },
  relatedHint:      { fontSize: 10, color: '#706e6b', marginTop: 1 },
  relatedNewBtn:    { borderWidth: 1, borderColor: '#0070d2', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 5 },
  relatedNewBtnText:{ color: '#0070d2', fontSize: 12, fontWeight: '600' },
  relatedTableHead: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#e8ecf0', backgroundColor: '#fafbfc' },
  relatedTH:        { fontSize: 10, fontWeight: '700', color: '#706e6b', textTransform: 'uppercase' },
  relatedRow:       { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f4f4f4', alignItems: 'center' },
  relatedRowClickable: { backgroundColor: '#fafeff' },
  relatedCell:      { fontSize: 13, color: '#16325c' },
  relatedCellLink:  { fontSize: 13, color: '#0070d2', fontWeight: '600' },
  relatedCellSub:   { fontSize: 10, color: '#706e6b', marginTop: 2 },
  relatedEmpty:     { padding: 24, alignItems: 'center' },
  relatedEmptyIcon: { fontSize: 28, marginBottom: 8 },
  relatedEmptyText: { fontSize: 13, color: '#444', fontWeight: '600', marginBottom: 4 },
  relatedEmptyHint: { fontSize: 12, color: '#706e6b', textAlign: 'center' },
  // Telecaller chips
  activeChip:       { fontSize: 10, fontWeight: '700', color: '#1a7431', backgroundColor: '#d4edda', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'center' },
  inactiveChip:     { fontSize: 10, fontWeight: '700', color: '#706e6b', backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'center' },
  // Hierarchy
  hierarchyRow:     { flexDirection: 'row', padding: 14, alignItems: 'center', gap: 10 },
  hierarchyIcon:    { width: 36, height: 36, borderRadius: 8, backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center' },
  hierarchyLabel:   { fontSize: 11, color: '#706e6b', textTransform: 'uppercase', marginBottom: 2 },
  hierarchyValue:   { fontSize: 14, fontWeight: '600', color: '#0070d2' },
  // Action buttons
  actionRow:        { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e8ecf0' },
  actionBtn:        { flex: 1, borderWidth: 1, borderColor: '#d8dde6', borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
  actionBtnPrimary: { borderColor: '#0070d2', backgroundColor: '#f0f7ff' },
  actionBtnIcon:    { fontSize: 16, marginBottom: 2 },
  actionBtnText:    { color: '#444', fontSize: 11, fontWeight: '600' },
  actionBtnDisabled:{ opacity: 0.5 },
  // Promotion Leads full-screen header
  plnFullHeader:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e8ecf0', elevation: 2 },
  plnBackBtn:       { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  plnBackArrow:     { fontSize: 22, color: '#0070d2', marginRight: 3, lineHeight: 24 },
  plnBackText:      { fontSize: 13, color: '#0070d2', fontWeight: '600' },
  plnFullTitle:     { fontSize: 14, fontWeight: '700', color: '#16325c' },
  plnFullSub:       { fontSize: 11, color: '#706e6b', marginTop: 1 },
  plnUploadHeaderBtn:    { borderWidth: 1, borderColor: '#059669', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  plnUploadHeaderBtnText:{ fontSize: 12, color: '#059669', fontWeight: '600' },
  // Promotion Leads related section buttons
  plnRelatedBtns:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 14 },
  plnActionBtn:     { borderWidth: 1, borderColor: '#0070d2', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 8 },
  plnActionBtnText: { color: '#0070d2', fontSize: 13, fontWeight: '600' },
});

const f = StyleSheet.create({
  fieldWrap:    { marginBottom: 12 },
  label:        { fontSize: 12, color: '#444', marginBottom: 3 },
  textInput:    { borderWidth: 1, borderColor: '#d8dde6', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#16325c', backgroundColor: '#fff' },
  dropdown:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#d8dde6', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  dropdownText: { fontSize: 14, color: '#16325c' },
  dropdownArrow:{ fontSize: 12, color: '#706e6b' },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', paddingHorizontal: 32 },
  pickerBox:    { backgroundColor: '#fff', borderRadius: 8, maxHeight: 300, elevation: 5 },
  pickerItem:   { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  pickerItemText:{ fontSize: 14, color: '#16325c' },
  sectionWrap:  { flexDirection: 'row', alignItems: 'center', marginVertical: 14 },
  sectionLine:  { flex: 1, height: 1, backgroundColor: '#d8dde6' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#0070d2', textTransform: 'uppercase', paddingHorizontal: 10 },
  toggleWrap:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingVertical: 4 },
  // Date picker
  dateBtn:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#d8dde6', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  dateBtnText:    { fontSize: 14, color: '#16325c', flex: 1 },
  dpCard:         { backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, padding: 16, elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8 },
  dpTitle:        { fontSize: 15, fontWeight: '700', color: '#16325c', marginBottom: 12, textAlign: 'center' },
  dpRow:          { flexDirection: 'row', gap: 6, height: 200 },
  dpCol:          { flex: 1 },
  dpColLabel:     { fontSize: 10, fontWeight: '700', color: '#706e6b', textAlign: 'center', marginBottom: 4, textTransform: 'uppercase' },
  dpScroll:       { flex: 1, borderWidth: 1, borderColor: '#e8ecf0', borderRadius: 6 },
  dpItem:         { paddingVertical: 9, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f4f6f9' },
  dpItemSel:      { backgroundColor: '#0070d2' },
  dpItemText:     { fontSize: 13, color: '#16325c' },
  dpItemTextSel:  { color: '#fff', fontWeight: '700' },
  dpFooter:       { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },
  dpClearBtn:     { borderWidth: 1, borderColor: '#d8dde6', borderRadius: 4, paddingHorizontal: 16, paddingVertical: 8 },
  dpClearText:    { fontSize: 13, color: '#706e6b', fontWeight: '600' },
  dpConfirmBtn:   { backgroundColor: '#0070d2', borderRadius: 4, paddingHorizontal: 20, paddingVertical: 8 },
  dpConfirmText:  { fontSize: 13, color: '#fff', fontWeight: '700' },
  // Campaign lookup
  lookupSelected:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#0070d2', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 9, backgroundColor: '#f0f7ff', gap: 8 },
  lookupSelectedIcon: { fontSize: 14 },
  lookupSelectedText: { flex: 1, fontSize: 14, color: '#0070d2', fontWeight: '600' },
  lookupTrigger:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#d8dde6', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  lookupTriggerText:  { fontSize: 14, color: '#aaa' },
  lookupBackdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  lookupCard:         { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '75%' },
  lookupHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e8ecf0' },
  lookupTitle:        { fontSize: 16, fontWeight: '700', color: '#16325c' },
  lookupClose:        { fontSize: 20, color: '#706e6b', padding: 4 },
  lookupSearch:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e8ecf0' },
  lookupSearchInput:  { flex: 1, borderWidth: 1, borderColor: '#d8dde6', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: '#16325c' },
  lookupItem:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 10 },
  lookupItemIcon:     { fontSize: 14 },
  lookupItemName:     { fontSize: 14, color: '#0070d2', fontWeight: '600' },
  lookupItemSub:      { fontSize: 11, color: '#706e6b', marginTop: 2 },
  lookupListEmpty:    { padding: 20, textAlign: 'center', color: '#706e6b', fontSize: 13 },
});

const mb = StyleSheet.create({
  backdrop:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  card:      { backgroundColor: '#fff', borderTopLeftRadius: 12, borderTopRightRadius: 12, paddingBottom: 24, maxHeight: '85%' },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e8ecf0' },
  title:     { fontSize: 17, fontWeight: '700', color: '#16325c' },
  subtitle:  { fontSize: 11, color: '#706e6b', marginTop: 2 },
  close:     { fontSize: 20, color: '#706e6b', padding: 4 },
  body:      { paddingHorizontal: 20, paddingTop: 14 },
  footer:    { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, paddingHorizontal: 20, paddingTop: 16 },
});

const csv = StyleSheet.create({
  backdrop:           { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  card:               { backgroundColor: '#fff', borderRadius: 8, width: '100%', maxHeight: '88%', elevation: 10 },
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e8ecf0' },
  title:              { fontSize: 17, fontWeight: '700', color: '#16325c' },
  subtitle:           { fontSize: 11, color: '#706e6b', marginTop: 2 },
  close:              { fontSize: 20, color: '#706e6b', padding: 4 },
  body:               { padding: 16 },
  uploadArea:         { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#d8dde6', borderRadius: 6, padding: 12, backgroundColor: '#f8fafc', marginBottom: 8 },
  uploadBtn:          { backgroundColor: '#0070d2', borderRadius: 4, paddingHorizontal: 16, paddingVertical: 10 },
  uploadBtnText:      { color: '#fff', fontWeight: '700', fontSize: 13 },
  fileBtn:            { borderWidth: 1, borderColor: '#0070d2', borderRadius: 4, paddingHorizontal: 14, paddingVertical: 9 },
  fileBtnText:        { color: '#0070d2', fontWeight: '600', fontSize: 13 },
  downloadBtn:        { borderWidth: 1, borderColor: '#0070d2', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 9 },
  downloadBtnText:    { color: '#0070d2', fontWeight: '700', fontSize: 14 },
  fileName:           { fontSize: 12, color: '#706e6b', marginBottom: 10 },
  // Result section for Campaign Members upload (with failed records table)
  resultSection:      { marginBottom: 10 },
  resultSummary:      { borderRadius: 4, padding: 10, marginBottom: 8 },
  resultSummarySuccess:{ backgroundColor: '#d4edda' },
  resultSummaryError: { backgroundColor: '#fce8e6' },
  resultSummaryText:  { fontSize: 13, fontWeight: '600', color: '#16325c' },
  failedTable:        { borderWidth: 1, borderColor: '#fecaca', borderRadius: 4, overflow: 'hidden' },
  failedTitle:        { fontSize: 12, fontWeight: '700', color: '#c0392b', padding: 8, backgroundColor: '#fef2f2' },
  failedHead:         { flexDirection: 'row', backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 5, borderTopWidth: 1, borderTopColor: '#fecaca' },
  failedTH:           { fontSize: 10, fontWeight: '700', color: '#666', textTransform: 'uppercase' },
  failedRow:          { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#fee2e2' },
  failedCell:         { fontSize: 11, color: '#16325c' },
  failedCellRed:      { fontSize: 11, color: '#c0392b' },
  // Simple result box for Promotion Leads upload
  resultBox:          { borderRadius: 4, padding: 10, marginBottom: 10 },
  resultSuccess:      { backgroundColor: '#d4edda' },
  resultError:        { backgroundColor: '#fce8e6' },
  resultText:         { fontSize: 13, color: '#1a7431', fontWeight: '600' },
  resultErrorText:    { fontSize: 12, color: '#c0392b', marginTop: 4 },
  instructions:       { marginTop: 8 },
  instrTitle:         { fontSize: 13, fontWeight: '700', color: '#16325c', marginBottom: 6 },
  instrItem:          { fontSize: 12, color: '#444', marginBottom: 4, lineHeight: 18 },
  csvFields:          { fontSize: 10, color: '#aaa', marginTop: 10, lineHeight: 16 },
  footer:             { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#e8ecf0' },
  cancelBtn:          { borderWidth: 1, borderColor: '#d8dde6', borderRadius: 4, paddingHorizontal: 20, paddingVertical: 9 },
  cancelBtnText:      { fontSize: 14, color: '#16325c', fontWeight: '600' },
});

const tan = StyleSheet.create({
  backdrop:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 12 },
  card:           { backgroundColor: '#fff', borderRadius: 8, width: '100%', maxHeight: '92%', elevation: 12 },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e8ecf0' },
  title:          { fontSize: 18, fontWeight: '700', color: '#16325c' },
  close:          { fontSize: 20, color: '#706e6b', padding: 4 },
  required:       { fontSize: 11, color: '#c0392b', textAlign: 'right', paddingHorizontal: 16, paddingVertical: 6, backgroundColor: '#fafbfc', borderBottomWidth: 1, borderBottomColor: '#e8ecf0' },
  body:           { padding: 12 },
  section:        { backgroundColor: '#f4f6f9', paddingHorizontal: 14, paddingVertical: 8, marginBottom: 8, borderRadius: 4 },
  sectionTitle:   { fontSize: 13, fontWeight: '700', color: '#16325c' },
  grid:           { flexDirection: 'row', gap: 12 },
  col:            { flex: 1 },
  fieldWrap:      { marginBottom: 12 },
  label:          { fontSize: 12, color: '#444', marginBottom: 4 },
  input:          { borderWidth: 1, borderColor: '#d8dde6', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: '#16325c', backgroundColor: '#fff' },
  textarea:       { height: 72, textAlignVertical: 'top' },
  dropdown:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#d8dde6', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 9, backgroundColor: '#fff' },
  dropdownText:   { fontSize: 13, color: '#16325c' },
  dropdownArrow:  { fontSize: 11, color: '#706e6b' },
  // Campaign / Telecaller lookup fields
  lookupBox:      { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d8dde6', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 7, backgroundColor: '#fff', gap: 6 },
  lookupIconBox:  { width: 24, height: 24, borderRadius: 4, backgroundColor: '#e8ecf0', alignItems: 'center', justifyContent: 'center' },
  lookupText:     { flex: 1, fontSize: 13, color: '#0070d2', fontWeight: '600' },
  lookupClear:    { padding: 4 },
  lookupEmpty:    { borderWidth: 1, borderColor: '#d8dde6', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 9, backgroundColor: '#fff' },
  lookupEmptyText:{ fontSize: 13, color: '#aaa' },
  // Telecaller row with undo icon (mimics SF yellow row)
  telecallerRow:  { backgroundColor: '#fffbf0', borderRadius: 4, padding: 6, marginHorizontal: -6 },
  undoBtn:        { alignSelf: 'flex-end', marginTop: 4 },
  undoBtnText:    { fontSize: 18, color: '#706e6b' },
  toggleRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  // Footer
  footer:         { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#e8ecf0' },
  cancelBtn:      { borderWidth: 1, borderColor: '#d8dde6', borderRadius: 4, paddingHorizontal: 18, paddingVertical: 9 },
  cancelBtnText:  { fontSize: 14, color: '#16325c', fontWeight: '600' },
  saveNewBtn:     { borderWidth: 1, borderColor: '#0070d2', borderRadius: 4, paddingHorizontal: 18, paddingVertical: 9, backgroundColor: '#fff', minWidth: 80, alignItems: 'center' },
  saveNewBtnText: { fontSize: 14, color: '#0070d2', fontWeight: '600' },
  saveBtn:        { backgroundColor: '#0070d2', borderRadius: 4, paddingHorizontal: 24, paddingVertical: 9, minWidth: 60, alignItems: 'center' },
  saveBtnText:    { fontSize: 14, color: '#fff', fontWeight: '700' },
  // User search modal
  userBackdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  userCard:       { backgroundColor: '#fff', borderTopLeftRadius: 12, borderTopRightRadius: 12, maxHeight: '75%' },
  userHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e8ecf0' },
  userTitle:      { fontSize: 16, fontWeight: '700', color: '#16325c' },
  userSearch:     { padding: 12, borderBottomWidth: 1, borderBottomColor: '#e8ecf0' },
  userSearchInput:{ borderWidth: 1, borderColor: '#d8dde6', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#16325c' },
  userItem:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 10 },
  userItemIcon:   { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e8ecf0', alignItems: 'center', justifyContent: 'center' },
  userItemName:   { fontSize: 14, color: '#0070d2', fontWeight: '600' },
  userItemSub:    { fontSize: 12, color: '#706e6b', marginTop: 2 },
  userEmpty:      { padding: 20, textAlign: 'center', color: '#706e6b' },
  // Sync status picker
  pickerOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', paddingHorizontal: 40 },
  pickerBox:      { backgroundColor: '#fff', borderRadius: 8, maxHeight: 280, elevation: 5 },
  pickerItem:     { paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  pickerItemText: { fontSize: 14, color: '#16325c' },
});

const bst = StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card:         { backgroundColor: '#fff', borderRadius: 10, width: '100%', maxHeight: '80%', elevation: 12 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e8ecf0' },
  title:        { fontSize: 17, fontWeight: '700', color: '#16325c' },
  close:        { fontSize: 20, color: '#706e6b', padding: 4 },
  body:         { padding: 16 },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16, justifyContent: 'center' },
  statusText:   { fontSize: 15, fontWeight: '700' },
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statBox:      { flex: 1, minWidth: 80, alignItems: 'center', backgroundColor: '#f4f6f9', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 8 },
  statIcon:     { fontSize: 18, marginBottom: 4 },
  statValue:    { fontSize: 22, fontWeight: '700', marginBottom: 2 },
  statLabel:    { fontSize: 10, color: '#706e6b', textAlign: 'center' },
  errorBox:     { backgroundColor: '#fef2f2', borderRadius: 6, padding: 12, borderWidth: 1, borderColor: '#fecaca', marginBottom: 10 },
  errorTitle:   { fontSize: 12, fontWeight: '700', color: '#c0392b', marginBottom: 4 },
  errorText:    { fontSize: 11, color: '#c0392b', lineHeight: 16 },
  hint:         { fontSize: 11, color: '#706e6b', textAlign: 'center', marginTop: 6 },
  footer:       { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#e8ecf0' },
  closeBtn:     { backgroundColor: '#0070d2', borderRadius: 4, paddingHorizontal: 24, paddingVertical: 9 },
  closeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

const syn = StyleSheet.create({
  backdrop:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  card:             { backgroundColor: '#fff', borderRadius: 10, width: '100%', maxHeight: '88%', elevation: 12 },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e8ecf0' },
  title:            { fontSize: 17, fontWeight: '700', color: '#16325c' },
  close:            { fontSize: 20, color: '#706e6b', padding: 4 },
  body:             { padding: 16 },
  intro:            { fontSize: 13, color: '#706e6b', marginBottom: 14, lineHeight: 19 },
  stepCard:         { backgroundColor: '#f8fafc', borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e8ecf0' },
  stepCardDisabled: { opacity: 0.45 },
  stepHeader:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  stepBadge:        { width: 28, height: 28, borderRadius: 14, backgroundColor: '#0070d2', alignItems: 'center', justifyContent: 'center' },
  stepBadgeDone:    { backgroundColor: '#1a7431' },
  stepBadgeOff:     { backgroundColor: '#d8dde6' },
  stepNum:          { fontSize: 13, fontWeight: '700', color: '#fff' },
  stepTitle:        { fontSize: 14, fontWeight: '700', color: '#16325c', marginBottom: 2 },
  stepDesc:         { fontSize: 12, color: '#706e6b', lineHeight: 17 },
  stepBtn:          { backgroundColor: '#0070d2', borderRadius: 6, paddingVertical: 9, alignItems: 'center' },
  stepBtnDone:      { backgroundColor: '#1a7431' },
  stepBtnLoading:   { backgroundColor: '#aac4e0' },
  stepBtnText:      { color: '#fff', fontWeight: '700', fontSize: 13 },
  statusRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, padding: 10, backgroundColor: '#f4f6f9', borderRadius: 6 },
  statusLabel:      { fontSize: 12, color: '#706e6b', fontWeight: '600' },
  statusValue:      { fontSize: 12, color: '#16325c', fontWeight: '700', flex: 1 },
  errorBox:         { marginTop: 8, backgroundColor: '#fef2f2', borderRadius: 6, padding: 10, borderWidth: 1, borderColor: '#fecaca' },
  errorText:        { fontSize: 11, color: '#c0392b', lineHeight: 16 },
  footer:           { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#e8ecf0' },
  closeBtn:         { backgroundColor: '#0070d2', borderRadius: 4, paddingHorizontal: 24, paddingVertical: 9 },
  closeBtnText:     { color: '#fff', fontWeight: '700', fontSize: 14 },
});

const ld = StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  card:         { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '88%' },
  header:       { flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e8ecf0', gap: 12 },
  avatar:       { width: 46, height: 46, borderRadius: 23, backgroundColor: '#0070d2', alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 20, fontWeight: '700', color: '#fff' },
  recordType:   { fontSize: 10, color: '#706e6b', textTransform: 'uppercase', marginBottom: 2 },
  name:         { fontSize: 17, fontWeight: '700', color: '#16325c', lineHeight: 22 },
  closeBtn:     { padding: 4 },
  closeBtnText: { fontSize: 22, color: '#706e6b' },
  body:         { paddingHorizontal: 16, paddingBottom: 32 },
  section:      { marginTop: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#0070d2', textTransform: 'uppercase', marginBottom: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#e8f0fb' },
  row:          { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f4f4f4' },
  label:        { width: 130, fontSize: 12, color: '#706e6b' },
  value:        { flex: 1, fontSize: 13, color: '#16325c', fontWeight: '500' },
});
