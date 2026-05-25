import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView,
  Platform, Modal, Switch,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {
  searchPromotionLeads, getPromotionLeadById, createPromotionLead, updatePromotionLead,
} from '../api/api';
import { searchCampaigns } from '../api/api';

// ── Shared form components ────────────────────────────────────────────
function TF({ label, value, onChange, required, multiline, keyboardType, autoCapitalize, placeholder }) {
  return (
    <View style={f.fieldWrap}>
      <Text style={f.label}>{required ? `* ${label}` : label}</Text>
      <TextInput
        style={[f.textInput, multiline && { height: 72, textAlignVertical: 'top' }]}
        value={value ?? ''}
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

function ToggleField({ label, value, onChange }) {
  return (
    <View style={f.toggleWrap}>
      <Text style={f.label}>{label}</Text>
      <Switch value={!!value} onValueChange={onChange} trackColor={{ false: '#d8dde6', true: '#0070d2' }} thumbColor="#fff" />
    </View>
  );
}

function SectionHeader({ title }) {
  return (
    <View style={f.sectionWrap}>
      <View style={f.sectionLine} />
      <Text style={f.sectionTitle}>{title}</Text>
      <View style={f.sectionLine} />
    </View>
  );
}

// Campaign lookup picker
function CampaignPicker({ value, name, onSelect }) {
  const [open, setOpen]         = useState(false);
  const [results, setResults]   = useState([]);
  const [query, setQuery]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function search(q) {
    setLoading(true);
    try { setResults((await searchCampaigns(q)) || []); }
    catch (_) {}
    finally { setLoading(false); }
  }

  function openModal() { setQuery(''); search(''); setOpen(true); }

  return (
    <View style={f.fieldWrap}>
      <Text style={f.label}>Campaign Name</Text>
      <TouchableOpacity style={f.dropdown} onPress={openModal}>
        <Text style={[f.dropdownText, !name && { color: '#aaa' }]} numberOfLines={1}>{name || 'Search Campaigns...'}</Text>
        <Text style={f.dropdownArrow}>▼</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={f.modalBackdrop}>
          <View style={f.modalCard}>
            <View style={f.modalHeader}>
              <Text style={f.modalTitle}>Select Campaign</Text>
              <TouchableOpacity onPress={() => setOpen(false)}><Text style={f.modalClose}>✕</Text></TouchableOpacity>
            </View>
            <View style={f.modalSearch}>
              <TextInput
                style={f.modalSearchInput}
                placeholder="Search..."
                value={query}
                onChangeText={q => { setQuery(q); search(q); }}
                placeholderTextColor="#aaa"
                autoCapitalize="none"
              />
            </View>
            {loading ? <ActivityIndicator style={{ margin: 20 }} /> : (
              <FlatList
                data={results}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={f.modalItem} onPress={() => { onSelect(item.id, item.campaign_name); setOpen(false); }}>
                    <Text style={f.modalItemText}>{item.campaign_name}</Text>
                    {item.status ? <Text style={f.modalItemSub}>{item.status}</Text> : null}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={f.modalEmpty}>No campaigns found</Text>}
              />
            )}
            <TouchableOpacity style={f.modalClear} onPress={() => { onSelect('', ''); setOpen(false); }}>
              <Text style={f.modalClearText}>Clear Campaign</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function emptyForm() {
  return {
    promotion_lead_name: '', campaign_id: '', campaign_name: '',
    branch_code: '', sales_office: '', sales_group_code: '',
    prospect_name: '', address: '',
    mobile_number: '', alternate_mobile_number: '', landline_number: '',
    email: '', pincode: '',
    dsa_code: '', depot_code: '', locality_code: '',
    dealer_code: '', vendor_code: '',
    source_of_data: '', is_bypass_validation: false, business_type: '',
    lead_source: '', owner_name: '', with_var: false,
    is_send_sms: false, sms_template_name: '',
    sms_var1: '', sms_var2: '', sms_var3: '', sms_var4: '', sms_var5: '',
    is_send_wa: false, whatsapp_template_name: '',
    wa_var1: '', wa_var2: '', wa_var3: '', wa_var4: '', wa_var5: '',
    is_send_email: false, email_template_name: '',
    em_var1: '', em_var2: '', em_var3: '', em_var4: '', em_var5: '',
    status: 'New',
  };
}

// ── Main Screen ───────────────────────────────────────────────────────
export default function PromotionLeadScreen({ initialCampaignId, initialCampaignName }) {
  const [view, setView]             = useState('list');
  const [leads, setLeads]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selected, setSelected]     = useState(null);
  const [form, setForm]             = useState(emptyForm());
  const [saving, setSaving]         = useState(false);
  const [detailTab, setDetailTab]   = useState('details');

  useEffect(() => {
    loadLeads('');
  }, []);

  async function loadLeads(q) {
    setLoading(true);
    try { setLeads((await searchPromotionLeads(q, initialCampaignId)) || []); }
    catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  }

  const sf = (key, val) => setForm(p => ({ ...p, [key]: val }));

  async function openDetail(item) {
    setLoading(true);
    try {
      const data = await getPromotionLeadById(item.id);
      setSelected(data);
      setDetailTab('details');
      setView('detail');
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  }

  function openCreate() {
    const base = emptyForm();
    if (initialCampaignId) {
      base.campaign_id   = initialCampaignId;
      base.campaign_name = initialCampaignName || '';
    }
    setForm(base);
    setView('create');
  }

  function openUpdate() {
    const d = selected;
    const f = emptyForm();
    Object.keys(f).forEach(k => {
      if (d[k] !== undefined && d[k] !== null) {
        f[k] = typeof f[k] === 'boolean' ? !!d[k] : String(d[k] ?? '');
      }
    });
    setForm(f);
    setView('update');
  }

  async function handleSave(isUpdate) {
    setSaving(true);
    try {
      const result = isUpdate
        ? await updatePromotionLead(selected.id, form)
        : await createPromotionLead(form);
      if (result.success) {
        Toast.show({ type: 'success', text1: `Promotion Lead ${isUpdate ? 'updated' : 'created'}.` });
        loadLeads('');
        if (isUpdate) {
          const updated = await getPromotionLeadById(selected.id);
          setSelected(updated);
          setView('detail');
        } else {
          setView('list');
        }
      } else {
        Toast.show({ type: 'error', text1: result.error || 'Save failed' });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message });
    } finally { setSaving(false); }
  }

  // ── LIST VIEW ───────────────────────────────────────────────────────
  if (view === 'list') return (
    <View style={s.container}>
      <View style={s.listHeader}>
        <View style={s.searchRow}>
          <TextInput
            style={s.searchInput}
            placeholder="Search promotion leads..."
            placeholderTextColor="#aaa"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={() => loadLeads(searchText.trim())}
            returnKeyType="search"
          />
          <TouchableOpacity style={s.searchBtn} onPress={() => loadLeads(searchText.trim())} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.searchBtnText}>Search</Text>}
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.newBtn} onPress={openCreate}>
          <Text style={s.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.listSubtitle}>
        {searchText.trim() ? `Results for "${searchText}"` : 'Recently Added'}
        {leads.length > 0 ? `  •  ${leads.length} record${leads.length !== 1 ? 's' : ''}` : ''}
      </Text>

      <View style={s.tableHeader}>
        <Text style={[s.th, { flex: 1.2 }]}>PLN NO.</Text>
        <Text style={[s.th, { flex: 2 }]}>PROSPECT NAME</Text>
        <Text style={[s.th, { flex: 1.5 }]}>CAMPAIGN</Text>
        <Text style={[s.th, { flex: 1.3 }]}>MOBILE</Text>
        <Text style={[s.th, { flex: 0.9 }]}>STATUS</Text>
      </View>

      <FlatList
        data={leads}
        keyExtractor={(item, i) => item.id || String(i)}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.tableRow} onPress={() => openDetail(item)}>
            <Text style={[s.tdLink, { flex: 1.2 }]} numberOfLines={1}>{item.pln_number || '—'}</Text>
            <View style={{ flex: 2 }}>
              <Text style={s.tdLink} numberOfLines={1}>{item.prospect_name || item.promotion_lead_name || '—'}</Text>
            </View>
            <Text style={[s.td, { flex: 1.5 }]} numberOfLines={1}>{item.campaign_name || '—'}</Text>
            <Text style={[s.td, { flex: 1.3 }]} numberOfLines={1}>{item.mobile_number || '—'}</Text>
            <View style={{ flex: 0.9 }}>
              <Text style={statusBadge(item.status)}>{item.status || 'New'}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={!loading && (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyText}>No promotion leads found</Text>
          </View>
        )}
      />
    </View>
  );

  // ── DETAIL VIEW ─────────────────────────────────────────────────────
  if (view === 'detail') {
    const d = selected || {};
    return (
      <View style={{ flex: 1, backgroundColor: '#f4f6f9' }}>

        {/* Header */}
        <View style={sd.headerCard}>
          <View style={sd.headerTop}>
            <View style={sd.iconBox}>
              <Text style={sd.iconText}>📋</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={sd.recordLabel}>Promotion Lead</Text>
              <Text style={sd.recordName}>{d.pln_number || 'PLN'}</Text>
            </View>
            <TouchableOpacity style={sd.editBtn} onPress={openUpdate}>
              <Text style={sd.editBtnText}>+ Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={sd.quickBar}>
            <QItem label="Promotion Lead Number" value={d.pln_number} />
            <QItem label="Owner"    value={d.owner_name} />
            <QItem label="Mobile"   value={d.mobile_number} />
            <QItem label="E-mail"   value={d.email} />
          </View>
        </View>

        {/* Tab bar */}
        <View style={sd.tabBar}>
          {['details', 'related'].map(tab => (
            <TouchableOpacity key={tab} style={sd.tabBtn} onPress={() => setDetailTab(tab)}>
              <Text style={[sd.tabLabel, detailTab === tab && sd.tabLabelActive]}>
                {tab === 'details' ? 'Details' : 'Related'}
              </Text>
              {detailTab === tab && <View style={sd.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {detailTab === 'details' ? (
            <>
              <SFSection title="Promotion Lead Information" onEdit={openUpdate}>
                <SFRow L="Promotion Lead Number" LV={d.pln_number}           R="Owner"        RV={d.owner_name}      onEdit={openUpdate} />
                <SFRow L="Promotion Lead Name"   LV={d.promotion_lead_name}  R="Mobile Number" RV={d.mobile_number}   onEdit={openUpdate} />
                <SFRow L="Branch"                LV={d.branch_code}          R="E-mail"        RV={d.email}           onEdit={openUpdate} />
                <SFRow L="Campaign Name"         LV={d.campaign_name}        R="Lead Source"   RV={d.lead_source}     onEdit={openUpdate} />
                <SFRow L="Prospect Name"         LV={d.prospect_name}        R="Business Type" RV={d.business_type}   onEdit={openUpdate} />
                <SFRow L="With var"              LV={d.with_var ? '✓' : '—'} R="Status"        RV={d.status}          onEdit={openUpdate} />
                <SFRow L="Source of Data"        LV={d.source_of_data}       R="Bypass Validation" RV={d.is_bypass_validation ? 'Yes' : 'No'} onEdit={openUpdate} />
              </SFSection>

              <SFSection title="Address &amp; Codes" onEdit={openUpdate}>
                <SFRow L="Address"        LV={d.address}       R="Pincode"        RV={d.pincode}        onEdit={openUpdate} />
                <SFRow L="Sales Office"   LV={d.sales_office}  R="Sales Group"    RV={d.sales_group_code} onEdit={openUpdate} />
                <SFRow L="Depot Code"     LV={d.depot_code}    R="Locality Code"  RV={d.locality_code}  onEdit={openUpdate} />
                <SFRow L="DSA Code"       LV={d.dsa_code}      R="Dealer Code"    RV={d.dealer_code}    onEdit={openUpdate} />
                <SFRow L="Vendor Code"    LV={d.vendor_code}   R="Landline"       RV={d.landline_number} onEdit={openUpdate} />
                <SFRow L="Alternate Mobile" LV={d.alternate_mobile_number} R="" RV="" onEdit={openUpdate} />
              </SFSection>

              <SFSection title="SMS Details" onEdit={openUpdate}>
                <SFRow L="Is Send SMS" LV={d.is_send_sms ? '✓' : '—'} R="SMS Template Name" RV={d.sms_template_name} onEdit={openUpdate} />
                <SFRow L="SMS Var 1"   LV={d.sms_var1}  R="SMS Var 2"  RV={d.sms_var2}  onEdit={openUpdate} />
                <SFRow L="SMS Var 3"   LV={d.sms_var3}  R="SMS Var 4"  RV={d.sms_var4}  onEdit={openUpdate} />
                <SFRow L="SMS Var 5"   LV={d.sms_var5}  R=""           RV=""            onEdit={openUpdate} />
              </SFSection>

              <SFSection title="WhatsApp Details" onEdit={openUpdate}>
                <SFRow L="Is Send WA" LV={d.is_send_wa ? '✓' : '—'} R="WhatsApp Template" RV={d.whatsapp_template_name} onEdit={openUpdate} />
                <SFRow L="WA Var 1"   LV={d.wa_var1}  R="WA Var 2"  RV={d.wa_var2}  onEdit={openUpdate} />
                <SFRow L="WA Var 3"   LV={d.wa_var3}  R="WA Var 4"  RV={d.wa_var4}  onEdit={openUpdate} />
                <SFRow L="WA Var 5"   LV={d.wa_var5}  R=""          RV=""           onEdit={openUpdate} />
              </SFSection>

              <SFSection title="Email Details" onEdit={openUpdate}>
                <SFRow L="Is Send Email" LV={d.is_send_email ? '✓' : '—'} R="Email Template" RV={d.email_template_name} onEdit={openUpdate} />
                <SFRow L="EM Var 1"      LV={d.em_var1}  R="EM Var 2"  RV={d.em_var2}  onEdit={openUpdate} />
                <SFRow L="EM Var 3"      LV={d.em_var3}  R="EM Var 4"  RV={d.em_var4}  onEdit={openUpdate} />
                <SFRow L="EM Var 5"      LV={d.em_var5}  R=""          RV=""           onEdit={openUpdate} />
              </SFSection>
            </>
          ) : (
            <View style={sd.relatedEmpty}>
              <Text style={sd.relatedEmptyText}>No related records found.</Text>
            </View>
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
      </View>
    );
  }

  // ── CREATE / EDIT FORM ──────────────────────────────────────────────
  const isUpdate = view === 'update';
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} keyboardShouldPersistTaps="handled">

        <View style={s.formHeader}>
          <View>
            <Text style={s.formHeaderSub}>Promotion Lead</Text>
            <Text style={s.formHeaderTitle}>{isUpdate ? 'Edit Promotion Lead' : 'New Promotion Lead'}</Text>
          </View>
          <TouchableOpacity onPress={() => setView(isUpdate ? 'detail' : 'list')}>
            <Text style={s.formCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        <SectionHeader title="Basic Information" />
        <TF label="Promotion Lead Name" value={form.promotion_lead_name} onChange={v => sf('promotion_lead_name', v)} />
        <CampaignPicker value={form.campaign_id} name={form.campaign_name} onSelect={(id, name) => { sf('campaign_id', id); sf('campaign_name', name); }} />
        <TF label="Owner Name"     value={form.owner_name}     onChange={v => sf('owner_name', v)} />
        <TF label="Lead Source"    value={form.lead_source}    onChange={v => sf('lead_source', v)} />
        <TF label="Prospect Name"  value={form.prospect_name}  onChange={v => sf('prospect_name', v)} />
        <TF label="Business Type"  value={form.business_type}  onChange={v => sf('business_type', v)} />
        <TF label="Source of Data" value={form.source_of_data} onChange={v => sf('source_of_data', v)} />
        <ToggleField label="With var"             value={form.with_var}             onChange={v => sf('with_var', v)} />
        <ToggleField label="Is Bypass Validation" value={form.is_bypass_validation} onChange={v => sf('is_bypass_validation', v)} />

        <SectionHeader title="Contact Information" />
        <TF label="Mobile Number"          value={form.mobile_number}           onChange={v => sf('mobile_number', v)}           keyboardType="phone-pad" autoCapitalize="none" />
        <TF label="Alternate Mobile"       value={form.alternate_mobile_number} onChange={v => sf('alternate_mobile_number', v)} keyboardType="phone-pad" autoCapitalize="none" />
        <TF label="Landline Number"        value={form.landline_number}         onChange={v => sf('landline_number', v)}         keyboardType="phone-pad" autoCapitalize="none" />
        <TF label="Email"                  value={form.email}                   onChange={v => sf('email', v)}                   keyboardType="email-address" autoCapitalize="none" />

        <SectionHeader title="Address &amp; Codes" />
        <TF label="Address"          value={form.address}          onChange={v => sf('address', v)}          multiline />
        <TF label="Pincode"          value={form.pincode}          onChange={v => sf('pincode', v)}          keyboardType="numeric" autoCapitalize="none" />
        <TF label="Branch Code"      value={form.branch_code}      onChange={v => sf('branch_code', v)} />
        <TF label="Sales Office"     value={form.sales_office}     onChange={v => sf('sales_office', v)} />
        <TF label="Sales Group Code" value={form.sales_group_code} onChange={v => sf('sales_group_code', v)} />
        <TF label="Depot Code"       value={form.depot_code}       onChange={v => sf('depot_code', v)} />
        <TF label="Locality Code"    value={form.locality_code}    onChange={v => sf('locality_code', v)} />
        <TF label="DSA Code"         value={form.dsa_code}         onChange={v => sf('dsa_code', v)} />
        <TF label="Dealer Code"      value={form.dealer_code}      onChange={v => sf('dealer_code', v)} />
        <TF label="Vendor Code"      value={form.vendor_code}      onChange={v => sf('vendor_code', v)} />

        <SectionHeader title="SMS Details" />
        <ToggleField label="Is Send SMS" value={form.is_send_sms} onChange={v => sf('is_send_sms', v)} />
        <TF label="SMS Template Name" value={form.sms_template_name} onChange={v => sf('sms_template_name', v)} />
        <TF label="SMS Var 1" value={form.sms_var1} onChange={v => sf('sms_var1', v)} />
        <TF label="SMS Var 2" value={form.sms_var2} onChange={v => sf('sms_var2', v)} />
        <TF label="SMS Var 3" value={form.sms_var3} onChange={v => sf('sms_var3', v)} />
        <TF label="SMS Var 4" value={form.sms_var4} onChange={v => sf('sms_var4', v)} />
        <TF label="SMS Var 5" value={form.sms_var5} onChange={v => sf('sms_var5', v)} />

        <SectionHeader title="WhatsApp Details" />
        <ToggleField label="Is Send WA" value={form.is_send_wa} onChange={v => sf('is_send_wa', v)} />
        <TF label="WhatsApp Template Name" value={form.whatsapp_template_name} onChange={v => sf('whatsapp_template_name', v)} />
        <TF label="WA Var 1" value={form.wa_var1} onChange={v => sf('wa_var1', v)} />
        <TF label="WA Var 2" value={form.wa_var2} onChange={v => sf('wa_var2', v)} />
        <TF label="WA Var 3" value={form.wa_var3} onChange={v => sf('wa_var3', v)} />
        <TF label="WA Var 4" value={form.wa_var4} onChange={v => sf('wa_var4', v)} />
        <TF label="WA Var 5" value={form.wa_var5} onChange={v => sf('wa_var5', v)} />

        <SectionHeader title="Email Details" />
        <ToggleField label="Is Send Email" value={form.is_send_email} onChange={v => sf('is_send_email', v)} />
        <TF label="Email Template Name" value={form.email_template_name} onChange={v => sf('email_template_name', v)} />
        <TF label="EM Var 1" value={form.em_var1} onChange={v => sf('em_var1', v)} />
        <TF label="EM Var 2" value={form.em_var2} onChange={v => sf('em_var2', v)} />
        <TF label="EM Var 3" value={form.em_var3} onChange={v => sf('em_var3', v)} />
        <TF label="EM Var 4" value={form.em_var4} onChange={v => sf('em_var4', v)} />
        <TF label="EM Var 5" value={form.em_var5} onChange={v => sf('em_var5', v)} />

        <View style={[s.btnRow, { marginTop: 20, marginBottom: 40 }]}>
          <TouchableOpacity style={s.primaryBtn} onPress={() => handleSave(isUpdate)} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Save</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.outlineBtn} onPress={() => setView(isUpdate ? 'detail' : 'list')}>
            <Text style={s.outlineBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────
function QItem({ label, value }) {
  if (!value) return null;
  return (
    <View style={sd.quickItem}>
      <Text style={sd.quickLabel}>{label}</Text>
      <Text style={sd.quickValue}>{value}</Text>
    </View>
  );
}

function SFSection({ title, children }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <View style={sd.section}>
      <TouchableOpacity style={sd.sectionHeader} onPress={() => setCollapsed(c => !c)} activeOpacity={0.8}>
        <Text style={sd.sectionChevron}>{collapsed ? '›' : '∨'}</Text>
        <Text style={sd.sectionTitle}>{title}</Text>
      </TouchableOpacity>
      {!collapsed && <View>{children}</View>}
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
          {onEdit && <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Text style={sd.sfEditIcon}>✎</Text></TouchableOpacity>}
        </View>
      </View>
      {!!R && (
        <View style={[sd.sfCell, { borderLeftWidth: 1, borderLeftColor: '#e8ecf0', paddingLeft: 12 }]}>
          <Text style={sd.sfCellLabel}>{R}</Text>
          <View style={sd.sfCellValueRow}>
            <Text style={sd.sfCellValue} numberOfLines={2}>{RV || ''}</Text>
            {onEdit && <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Text style={sd.sfEditIcon}>✎</Text></TouchableOpacity>}
          </View>
        </View>
      )}
    </View>
  );
}

const STATUS_COLORS = {
  New:       { bg: '#e8f4fd', text: '#0070d2' },
  Sent:      { bg: '#fff3cd', text: '#856404' },
  Responded: { bg: '#d4edda', text: '#1a7431' },
  Opted_Out: { bg: '#fce8e6', text: '#c0392b' },
};
function statusBadge(s) {
  const c = STATUS_COLORS[s] || { bg: '#f0f0f0', text: '#444' };
  return { fontSize: 11, fontWeight: '600', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: c.bg, color: c.text, alignSelf: 'flex-start' };
}

// ── Styles ─────────────────────────────────────────────────────────────
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
  btnRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  primaryBtn:    { backgroundColor: '#0070d2', borderRadius: 4, paddingHorizontal: 24, paddingVertical: 10 },
  primaryBtnText:{ color: '#fff', fontWeight: '700', fontSize: 14 },
  outlineBtn:    { borderWidth: 1, borderColor: '#0070d2', borderRadius: 4, paddingHorizontal: 14, paddingVertical: 8 },
  outlineBtnText:{ color: '#0070d2', fontSize: 13, fontWeight: '600' },
  formHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e8ecf0' },
  formHeaderSub: { fontSize: 12, color: '#706e6b', marginBottom: 2 },
  formHeaderTitle:{ fontSize: 17, fontWeight: '700', color: '#16325c' },
  formCloseText: { fontSize: 20, color: '#706e6b', padding: 4 },
});

const sd = StyleSheet.create({
  headerCard:    { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e8ecf0', elevation: 2 },
  headerTop:     { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBox:       { width: 40, height: 40, borderRadius: 8, backgroundColor: '#f59e0b', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  iconText:      { fontSize: 20 },
  recordLabel:   { fontSize: 11, color: '#706e6b', marginBottom: 2 },
  recordName:    { fontSize: 17, fontWeight: '700', color: '#16325c' },
  editBtn:       { borderWidth: 1.5, borderColor: '#0070d2', borderRadius: 4, paddingHorizontal: 14, paddingVertical: 6 },
  editBtnText:   { fontSize: 13, fontWeight: '600', color: '#0070d2' },
  quickBar:      { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  quickItem:     { minWidth: 80 },
  quickLabel:    { fontSize: 11, color: '#706e6b', marginBottom: 2 },
  quickValue:    { fontSize: 13, fontWeight: '600', color: '#16325c' },
  tabBar:        { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e8ecf0' },
  tabBtn:        { paddingHorizontal: 20, paddingVertical: 12, position: 'relative', alignItems: 'center' },
  tabLabel:      { fontSize: 14, fontWeight: '500', color: '#706e6b' },
  tabLabelActive:{ color: '#0070d2', fontWeight: '700' },
  tabUnderline:  { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: '#0070d2', borderRadius: 2 },
  section:       { backgroundColor: '#fff', marginTop: 10, marginHorizontal: 10, borderRadius: 6, overflow: 'hidden', elevation: 1, borderWidth: 1, borderColor: '#e8ecf0' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f6f9', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e8ecf0' },
  sectionChevron:{ fontSize: 15, color: '#706e6b', marginRight: 8, width: 16 },
  sectionTitle:  { fontSize: 13, fontWeight: '700', color: '#16325c' },
  sfRow:         { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f0f2f5' },
  sfCell:        { flex: 1, paddingHorizontal: 14, paddingVertical: 10 },
  sfCellLabel:   { fontSize: 11, color: '#706e6b', marginBottom: 3 },
  sfCellValueRow:{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  sfCellValue:   { flex: 1, fontSize: 13, color: '#16325c', fontWeight: '500' },
  sfEditIcon:    { fontSize: 14, color: '#c0c0c0', marginLeft: 4 },
  relatedEmpty:  { padding: 30, alignItems: 'center' },
  relatedEmptyText: { fontSize: 13, color: '#706e6b' },
});

const f = StyleSheet.create({
  fieldWrap:      { marginBottom: 12 },
  label:          { fontSize: 12, color: '#444', marginBottom: 3 },
  textInput:      { borderWidth: 1, borderColor: '#d8dde6', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#16325c', backgroundColor: '#fff' },
  dropdown:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#d8dde6', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  dropdownText:   { fontSize: 14, color: '#16325c', flex: 1 },
  dropdownArrow:  { fontSize: 12, color: '#706e6b' },
  toggleWrap:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingVertical: 4 },
  sectionWrap:    { flexDirection: 'row', alignItems: 'center', marginVertical: 14 },
  sectionLine:    { flex: 1, height: 1, backgroundColor: '#d8dde6' },
  sectionTitle:   { fontSize: 12, fontWeight: '700', color: '#0070d2', textTransform: 'uppercase', paddingHorizontal: 10 },
  modalBackdrop:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard:      { backgroundColor: '#fff', borderTopLeftRadius: 12, borderTopRightRadius: 12, maxHeight: '80%' },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e8ecf0' },
  modalTitle:     { fontSize: 16, fontWeight: '700', color: '#16325c' },
  modalClose:     { fontSize: 20, color: '#706e6b', padding: 4 },
  modalSearch:    { padding: 12, borderBottomWidth: 1, borderBottomColor: '#e8ecf0' },
  modalSearchInput:{ borderWidth: 1, borderColor: '#d8dde6', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#16325c' },
  modalItem:      { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalItemText:  { fontSize: 14, color: '#0070d2', fontWeight: '600' },
  modalItemSub:   { fontSize: 12, color: '#706e6b', marginTop: 2 },
  modalEmpty:     { padding: 20, textAlign: 'center', color: '#706e6b' },
  modalClear:     { padding: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e8ecf0' },
  modalClearText: { color: '#c0392b', fontSize: 14, fontWeight: '600' },
});
