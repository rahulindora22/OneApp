import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView,
  Platform, Modal, Switch,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { searchLeads, createLead, updateLead } from '../api/api';
import { useAuth } from '../context/AuthContext';

// ── Record Types ─────────────────────────────────────────────────────
const RECORD_TYPES = [
  { key: 'Household Fresh',   description: 'This record type will capture fresh leads in the system.' },
  { key: 'Generate Lead',     description: 'This record type is assigned to field users who can manually create lead.' },
  { key: 'Household Renewal', description: 'This record type will capture renewal leads in the system.' },
  { key: 'Institutional',     description: 'Prospects of office or bulk copy sales. Includes Hospitality, Transport business etc.' },
  { key: 'Reader',            description: 'This record type is used to capture the subscriber/customer details manually.' },
];

// ── Picklists ────────────────────────────────────────────────────────
const SALUTATION_OPTIONS  = ['--None--', 'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];
const GENDER_OPTIONS      = ['--None--', 'Male', 'Female', 'Other'];
const RATING_OPTIONS      = ['--None--', 'Hot', 'Warm', 'Cold'];
const STATUS_OPTIONS      = ['New', 'Working', 'Nurturing', 'Unqualified', 'Qualified'];
const SOURCE_OPTIONS      = ['--None--', 'Web', 'Phone Inquiry', 'Partner Referral', 'Trade Show', 'Employee Referral', 'Advertisement', 'Other'];
const CALL_STATUS_OPTIONS = ['--None--', 'Connected', 'Not Connected', 'Call Back', 'Busy', 'Wrong Number', 'Switch Off'];
const VISIT_STATUS_OPTIONS= ['--None--', 'Confirm_Order', 'Order_Placed', 'Revisit', 'Not_Interested', 'Not_Available'];
const VERTICAL_OPTIONS    = ['--None--', 'Newspaper', 'Magazine', 'Digital'];
const ORDER_TYPE_OPTIONS  = ['--None--', 'Fresh', 'Renewal'];
const INTERESTED_OPTIONS  = ['--None--', 'Yes', 'No', 'Maybe'];
const AGE_GROUP_OPTIONS   = ['--None--', '18-25', '26-35', '36-45', '46-55', '56-65', '65+'];
const INCOME_OPTIONS      = ['--None--', '<2L', '2-5L', '5-10L', '10-20L', '>20L'];
const DELIVERY_OPTIONS    = ['--None--', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'All Days'];

// ── Shared Components ────────────────────────────────────────────────
function SectionHeader({ title }) {
  return (
    <View style={f.sectionWrap}>
      <View style={f.sectionLine} />
      <Text style={f.sectionTitle}>{title}</Text>
      <View style={f.sectionLine} />
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

function ToggleField({ label, value, onChange }) {
  return (
    <View style={f.toggleWrap}>
      <Text style={f.label}>{label}</Text>
      <Switch
        value={!!value}
        onValueChange={onChange}
        trackColor={{ false: '#d8dde6', true: '#0070d2' }}
        thumbColor="#fff"
      />
    </View>
  );
}

// ── Record Type Modal ────────────────────────────────────────────────
function RecordTypeModal({ visible, onNext, onCancel }) {
  const [selected, setSelected] = useState('Household Fresh');
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={rt.backdrop}>
        <View style={rt.card}>
          <View style={rt.header}>
            <Text style={rt.title}>New Lead</Text>
            <TouchableOpacity onPress={onCancel}><Text style={rt.closeText}>✕</Text></TouchableOpacity>
          </View>
          <View style={rt.divider} />
          <ScrollView style={rt.body} showsVerticalScrollIndicator={false}>
            <Text style={rt.selectLabel}>Select a record type</Text>
            {RECORD_TYPES.map((item) => {
              const active = selected === item.key;
              return (
                <TouchableOpacity key={item.key} style={rt.optionRow} onPress={() => setSelected(item.key)}>
                  <View style={[rt.radio, active && rt.radioSelected]}>
                    {active && <View style={rt.radioDot} />}
                  </View>
                  <View style={rt.optionText}>
                    <Text style={rt.optionTitle}>{item.key}</Text>
                    <Text style={rt.optionDesc}>{item.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={rt.divider} />
          <View style={rt.footer}>
            <TouchableOpacity style={rt.cancelBtn} onPress={onCancel}>
              <Text style={rt.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={rt.nextBtn} onPress={() => onNext(selected)}>
              <Text style={rt.nextBtnText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── emptyForm ────────────────────────────────────────────────────────
function emptyForm(recordType = 'Household Fresh') {
  return {
    record_type: recordType,
    salutation: '', first_name: '', last_name: '', title: '',
    gender: '', birth_date: '', age: '', age_group: '',
    education: '', occupation: '', income_range: '', no_of_children: '',
    phone: '', mobile: '', alternate_mobile: '', alternate_mobile2: '',
    email: '', alternate_email: '', sms_mobile: '',
    house_no: '', floor_no: '', building_wing_tower: '',
    society_apartment_name: '', society_name: '',
    street_colony_road: '', landmark: '', pocket_block: '',
    locality_name: '', locality_code: '', pincode: '',
    city: '', district: '', state: '', address: '', rmd_address: '',
    company: '', industry: '', rating: '', website: '',
    vertical: '', order_type: '',
    lead_status: 'New', lead_source: '',
    call_status: '', visit_status: '', interested: '',
    primary_contact: '', pre_prospect_record_type: '',
    publications: '', branch_code: '', depot_code: '',
    crm_email: '', owner_name: '', payee_name: '',
    agree_terms: false, opt_in: false,
    next_action_datetime: '', next_action_remarks: '',
    appointment_datetime: '', interested_on_date: '',
    reason: '', interest: '', competition: '', reason_for_lost: '',
    measure_of_potential: '', number_of_copies: '', period_of_contract: '',
    potential_count: '', type_of_model: '',
    industry_type: '', industry_sub_category: '', day_of_delivery: '',
    description: '',
    toi: '', et: '', etw: '', mm: '', mt: '', nbt: '',
    am: '', bm: '', bbm: '', pm: '', st: '', vke: '',
  };
}

function fullName(item) {
  const fn = (item?.first_name || '').trim();
  const ln = (item?.last_name  || '').trim();
  return fn ? `${fn} ${ln}` : ln;
}

// ── Main Screen ──────────────────────────────────────────────────────
export default function LeadScreen() {
  const { userId } = useAuth();
  const [view, setView]         = useState('list');
  const [leads, setLeads]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState(emptyForm());
  const [saving, setSaving]     = useState(false);
  const [rtModal, setRtModal]     = useState(false);
  const [detailTab, setDetailTab] = useState('details');

  useEffect(() => { loadLeads(''); }, []);

  async function loadLeads(q) {
    setLoading(true);
    try { setLeads((await searchLeads(q)) || []); }
    catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  }

  const sf = (key, val) => setForm(p => ({ ...p, [key]: val }));

  function handleNewPress() { setRtModal(true); }

  function handleRTNext(rt) {
    setRtModal(false);
    setForm(emptyForm(rt));
    setView('create');
  }

  function openDetail(item) { setSelected(item); setDetailTab('details'); setView('detail'); }

  function openUpdate() {
    const f = emptyForm(selected.record_type || 'Household Fresh');
    Object.keys(f).forEach(k => {
      if (selected[k] !== undefined && selected[k] !== null) {
        f[k] = k === 'agree_terms' || k === 'opt_in' ? !!selected[k] : String(selected[k] ?? '');
      }
    });
    setForm(f);
    setView('update');
  }

  async function handleSave(isUpdate) {
    if (!form.last_name.trim()) return Toast.show({ type: 'error', text1: '* Last Name is required.' });
    if (!form.company.trim())   return Toast.show({ type: 'error', text1: '* Company is required.' });
    setSaving(true);
    try {
      const payload = { ...form, created_by: userId };
      const result  = isUpdate
        ? await updateLead(selected.id, payload)
        : await createLead(payload);
      if (result.success) {
        Toast.show({ type: 'success', text1: `Lead ${isUpdate ? 'updated' : 'created'} successfully.` });
        setView('list');
        loadLeads('');
      } else {
        Toast.show({ type: 'error', text1: result.error || 'Save failed' });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message });
    } finally {
      setSaving(false);
    }
  }

  // ── List View ──────────────────────────────────────────────────────
  if (view === 'list') return (
    <View style={s.container}>
      <RecordTypeModal visible={rtModal} onNext={handleRTNext} onCancel={() => setRtModal(false)} />
      <View style={s.listHeader}>
        <View style={s.searchRow}>
          <TextInput style={s.searchInput} placeholder="Search leads..." placeholderTextColor="#aaa"
            value={searchText} onChangeText={setSearchText}
            onSubmitEditing={() => loadLeads(searchText.trim())} returnKeyType="search" />
          <TouchableOpacity style={s.searchBtn} onPress={() => loadLeads(searchText.trim())} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.searchBtnText}>Search</Text>}
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.newBtn} onPress={handleNewPress}>
          <Text style={s.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.listSubtitle}>
        {searchText.trim() ? `Results for "${searchText}"` : 'Recently Added'}
        {leads.length > 0 ? `  •  ${leads.length} record${leads.length !== 1 ? 's' : ''}` : ''}
      </Text>

      <View style={s.tableHeader}>
        <Text style={[s.th, { flex: 2 }]}>NAME</Text>
        <Text style={[s.th, { flex: 1 }]}>STATUS</Text>
        <Text style={[s.th, { flex: 1 }]}>DEPOT</Text>
        <Text style={[s.th, { flex: 1.2 }]}>MOBILE</Text>
        <Text style={[s.th, { flex: 1.2 }]}>CREATED</Text>
      </View>

      <FlatList
        data={leads}
        keyExtractor={(item, i) => item.id || String(i)}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.tableRow} onPress={() => openDetail(item)}>
            <View style={{ flex: 2 }}>
              <Text style={s.tdLink} numberOfLines={1}>{fullName(item)}</Text>
              <Text style={s.tdSub} numberOfLines={1}>{item.company || ''}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={statusStyle(item.lead_status)}>{item.lead_status || '—'}</Text>
            </View>
            <Text style={[s.td, { flex: 1 }]} numberOfLines={1}>{item.depot_code || '—'}</Text>
            <Text style={[s.td, { flex: 1.2 }]} numberOfLines={1}>{item.mobile || '—'}</Text>
            <Text style={[s.td, { flex: 1.2 }]} numberOfLines={1}>{item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' }) : '—'}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={!loading && (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>👤</Text>
            <Text style={s.emptyText}>No leads found</Text>
          </View>
        )}
      />
    </View>
  );

  // ── Detail View ────────────────────────────────────────────────────
  if (view === 'detail') {
    const d = selected || {};
    return (
      <View style={{ flex: 1, backgroundColor: '#f4f6f9' }}>

        {/* ── SF-style header card ── */}
        <View style={sd.headerCard}>
          <View style={sd.headerTop}>
            <View style={sd.starBox}>
              <Text style={sd.starIcon}>★</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={sd.leadLabel}>Lead</Text>
              <Text style={sd.leadName} numberOfLines={1}>{fullName(d)}</Text>
            </View>
            <TouchableOpacity style={sd.followBtn} onPress={openUpdate}>
              <Text style={sd.followBtnText}>+ Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Quick info bar */}
          <View style={sd.quickBar}>
            {!!d.mobile && (
              <View style={sd.quickItem}>
                <Text style={sd.quickLabel}>Mobile</Text>
                <Text style={sd.quickLink}>{d.mobile}</Text>
              </View>
            )}
            {!!d.company && (
              <View style={sd.quickItem}>
                <Text style={sd.quickLabel}>Account</Text>
                <Text style={sd.quickLink}>{d.company}</Text>
              </View>
            )}
            {!!d.lead_id && (
              <View style={sd.quickItem}>
                <Text style={sd.quickLabel}>Order</Text>
                <Text style={sd.quickLink}>{d.lead_id}</Text>
              </View>
            )}
            {!!d.order_expiry_date && (
              <View style={sd.quickItem}>
                <Text style={sd.quickLabel}>Order Expiry Date</Text>
                <Text style={sd.quickValue}>{d.order_expiry_date}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Details / Related tab bar ── */}
        <View style={sd.tabBar}>
          <TouchableOpacity style={sd.tabBtn} onPress={() => setDetailTab('details')}>
            <Text style={[sd.tabLabel, detailTab === 'details' && sd.tabLabelActive]}>Details</Text>
            {detailTab === 'details' && <View style={sd.tabUnderline} />}
          </TouchableOpacity>
          <TouchableOpacity style={sd.tabBtn} onPress={() => setDetailTab('related')}>
            <Text style={[sd.tabLabel, detailTab === 'related' && sd.tabLabelActive]}>Related</Text>
            {detailTab === 'related' && <View style={sd.tabUnderline} />}
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {detailTab === 'details' ? (
            <>
              <SFSection title="Prospect Information" onEdit={openUpdate}>
                <SFRow L="Name"             LV={fullName(d)}           R="Mobile"                RV={d.mobile}              onEdit={openUpdate} />
                <SFRow L="Order"            LV={d.lead_id}             R="Alternate Contact No 1" RV={d.alternate_mobile}    onEdit={openUpdate} />
                <SFRow L="Account"          LV={d.company}             R="Alternate Contact No 2" RV={d.alternate_mobile2}   onEdit={openUpdate} />
                <SFRow L="Email"            LV={d.email}               R="Primary Contact"        RV={d.primary_contact}     onEdit={openUpdate} />
                <SFRow L="Alternate Email"  LV={d.alternate_email}     R="Order Expiry Date"      RV={d.order_expiry_date}   onEdit={openUpdate} />
                <SFRow L="Call Status"      LV={d.call_status}         R="Lead Record Type"       RV={d.record_type}         onEdit={openUpdate} />
                <SFRow L="Lead owner BP ID" LV={d.rmd_bp_id}           R="Visit Status"           RV={d.visit_status}        onEdit={openUpdate} />
                <SFRow L="Lead Status"      LV={d.lead_status}         R="Lead Source"            RV={d.lead_source}         onEdit={openUpdate} />
                <SFRow L="Interested"       LV={d.interested}          R="Payee Name"             RV={d.payee_name}          onEdit={openUpdate} />
              </SFSection>

              <SFSection title="Address Information" onEdit={openUpdate}>
                <SFRow L="House No."              LV={d.house_no}              R="Floor"               RV={d.floor_no}              onEdit={openUpdate} />
                <SFRow L="Building / Wing / Tower"LV={d.building_wing_tower}   R="Society / Apt Name"  RV={d.society_apartment_name} onEdit={openUpdate} />
                <SFRow L="Street / Colony / Road" LV={d.street_colony_road}    R="Landmark"            RV={d.landmark}              onEdit={openUpdate} />
                <SFRow L="Locality Name"          LV={d.locality_name}         R="Locality Code"       RV={d.locality_code}         onEdit={openUpdate} />
                <SFRow L="Pincode"                LV={d.pincode}               R="City"                RV={d.city}                  onEdit={openUpdate} />
                <SFRow L="District"               LV={d.district}              R="State"               RV={d.state}                 onEdit={openUpdate} />
              </SFSection>

              <SFSection title="Branch & Depot" onEdit={openUpdate}>
                <SFRow L="Branch Code"  LV={d.branch_code}   R="Depot Code"   RV={d.depot_code}    onEdit={openUpdate} />
                <SFRow L="Vertical"     LV={d.vertical}      R="Order Type"   RV={d.order_type}    onEdit={openUpdate} />
                <SFRow L="Publications" LV={d.publications}  R="Rating"       RV={d.rating}        onEdit={openUpdate} />
              </SFSection>

              <SFSection title="Follow-up & Actions" onEdit={openUpdate}>
                <SFRow L="Next Action Date/Time"  LV={d.next_action_datetime}  R="Appointment Date/Time" RV={d.appointment_datetime}  onEdit={openUpdate} />
                <SFRow L="Next Action Remarks"    LV={d.next_action_remarks}   R="Interested On Date"    RV={d.interested_on_date}    onEdit={openUpdate} />
                <SFRow L="Reason"                 LV={d.reason}                R="Competition"           RV={d.competition}           onEdit={openUpdate} />
                <SFRow L="Reason for Lost"        LV={d.reason_for_lost}       R=""                      RV=""                        onEdit={openUpdate} />
              </SFSection>

              <SFSection title="Personal Details" onEdit={openUpdate}>
                <SFRow L="Salutation"    LV={d.salutation}     R="Gender"        RV={d.gender}        onEdit={openUpdate} />
                <SFRow L="Date of Birth" LV={d.birth_date}     R="Age Group"     RV={d.age_group}     onEdit={openUpdate} />
                <SFRow L="Occupation"    LV={d.occupation}     R="Income Range"  RV={d.income_range}  onEdit={openUpdate} />
                <SFRow L="Agree Terms"   LV={d.agree_terms ? 'Yes' : 'No'} R="Opt In" RV={d.opt_in ? 'Yes' : 'No'} onEdit={openUpdate} />
              </SFSection>
            </>
          ) : (
            /* ── Related Tab ── */
            <View style={sd.relatedSection}>
              <View style={sd.relatedHeader}>
                <View style={sd.relatedIconBox}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>✓</Text>
                </View>
                <Text style={sd.relatedTitle}>Product Line Items</Text>
              </View>
              <View style={sd.relatedTableHead}>
                <Text style={[sd.relatedTH, { flex: 1.2 }]}>Name</Text>
                <Text style={[sd.relatedTH, { flex: 2 }]}>Product</Text>
                <Text style={[sd.relatedTH, { flex: 1.2 }]}>Impl. Date</Text>
                <Text style={[sd.relatedTH, { flex: 1.5 }]}>Payment Txn</Text>
              </View>
              <View style={sd.relatedEmpty}>
                <Text style={sd.relatedEmptyText}>No product line items found.</Text>
              </View>
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

  // ── Create / Update Form ───────────────────────────────────────────
  const isUpdate = view === 'update';
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.tagRow}>
          <View style={s.tag}><Text style={s.tagText}>Lead</Text></View>
          {form.record_type ? <View style={[s.tag, s.tagGray]}><Text style={[s.tagText, s.tagTextGray]}>{form.record_type}</Text></View> : null}
        </View>
        <Text style={s.pageTitle}>{isUpdate ? 'Edit Lead' : 'New Lead'}</Text>

        {/* ── Basic Information ── */}
        <SectionHeader title="Basic Information" />
        <DropdownPicker label="Salutation"  value={form.salutation}  options={SALUTATION_OPTIONS}  onSelect={v => sf('salutation', v)} />
        <TF label="First Name" value={form.first_name} onChange={v => sf('first_name', v)} />
        <TF label="Last Name"  value={form.last_name}  onChange={v => sf('last_name', v)} required />
        <TF label="Title"      value={form.title}      onChange={v => sf('title', v)} />
        <DropdownPicker label="Gender"     value={form.gender}     options={GENDER_OPTIONS}    onSelect={v => sf('gender', v)} />
        <TF label="Date of Birth (YYYY-MM-DD)" value={form.birth_date} onChange={v => sf('birth_date', v)} keyboardType="numbers-and-punctuation" autoCapitalize="none" />
        <DropdownPicker label="Age Group"  value={form.age_group}  options={AGE_GROUP_OPTIONS}  onSelect={v => sf('age_group', v)} />
        <TF label="Occupation"   value={form.occupation}   onChange={v => sf('occupation', v)} />
        <DropdownPicker label="Income Range" value={form.income_range} options={INCOME_OPTIONS} onSelect={v => sf('income_range', v)} />

        {/* ── Contact Information ── */}
        <SectionHeader title="Contact Information" />
        <TF label="Phone"          value={form.phone}          onChange={v => sf('phone', v)}          keyboardType="phone-pad" autoCapitalize="none" />
        <TF label="Mobile"         value={form.mobile}         onChange={v => sf('mobile', v)}         keyboardType="phone-pad" autoCapitalize="none" />
        <TF label="Alternate Mobile"   value={form.alternate_mobile}  onChange={v => sf('alternate_mobile', v)}  keyboardType="phone-pad" autoCapitalize="none" />
        <TF label="Alternate Mobile 2" value={form.alternate_mobile2} onChange={v => sf('alternate_mobile2', v)} keyboardType="phone-pad" autoCapitalize="none" />
        <TF label="Email"          value={form.email}          onChange={v => sf('email', v)}          keyboardType="email-address" autoCapitalize="none" />
        <TF label="Alternate Email"value={form.alternate_email}onChange={v => sf('alternate_email', v)}keyboardType="email-address" autoCapitalize="none" />

        {/* ── Address ── */}
        <SectionHeader title="Address" />
        <TF label="House No."              value={form.house_no}              onChange={v => sf('house_no', v)} />
        <TF label="Floor"                  value={form.floor_no}              onChange={v => sf('floor_no', v)} />
        <TF label="Building / Wing / Tower"value={form.building_wing_tower}   onChange={v => sf('building_wing_tower', v)} />
        <TF label="Society / Apartment"    value={form.society_apartment_name}onChange={v => sf('society_apartment_name', v)} />
        <TF label="Society Name"           value={form.society_name}          onChange={v => sf('society_name', v)} />
        <TF label="Street / Colony / Road" value={form.street_colony_road}    onChange={v => sf('street_colony_road', v)} />
        <TF label="Landmark"               value={form.landmark}              onChange={v => sf('landmark', v)} />
        <TF label="Pocket / Block"         value={form.pocket_block}          onChange={v => sf('pocket_block', v)} />
        <TF label="Locality Name"          value={form.locality_name}         onChange={v => sf('locality_name', v)} />
        <TF label="Locality Code"          value={form.locality_code}         onChange={v => sf('locality_code', v)} autoCapitalize="characters" />
        <TF label="Pincode"                value={form.pincode}               onChange={v => sf('pincode', v)} keyboardType="numeric" autoCapitalize="none" />
        <TF label="City"                   value={form.city}                  onChange={v => sf('city', v)} />
        <TF label="District"               value={form.district}              onChange={v => sf('district', v)} />
        <TF label="State"                  value={form.state}                 onChange={v => sf('state', v)} />
        <TF label="Full Address"           value={form.address}               onChange={v => sf('address', v)} multiline />

        {/* ── Business ── */}
        <SectionHeader title="Business" />
        <TF label="Company" value={form.company} onChange={v => sf('company', v)} required />
        <TF label="Industry" value={form.industry} onChange={v => sf('industry', v)} />
        <DropdownPicker label="Rating"     value={form.rating}     options={RATING_OPTIONS}     onSelect={v => sf('rating', v)} />
        <TF label="Website" value={form.website} onChange={v => sf('website', v)} keyboardType="url" autoCapitalize="none" />
        <DropdownPicker label="Vertical"   value={form.vertical}   options={VERTICAL_OPTIONS}   onSelect={v => sf('vertical', v)} />
        <DropdownPicker label="Order Type" value={form.order_type} options={ORDER_TYPE_OPTIONS}  onSelect={v => sf('order_type', v)} />
        <TF label="Publications (e.g. TOI, ET)" value={form.publications} onChange={v => sf('publications', v)} />

        {/* ── Lead Details ── */}
        <SectionHeader title="Lead Details" />
        <DropdownPicker label="Lead Status"  value={form.lead_status}  options={STATUS_OPTIONS}       onSelect={v => sf('lead_status', v)} required />
        <DropdownPicker label="Lead Source"  value={form.lead_source}  options={SOURCE_OPTIONS}       onSelect={v => sf('lead_source', v)} />
        <DropdownPicker label="Call Status"  value={form.call_status}  options={CALL_STATUS_OPTIONS}  onSelect={v => sf('call_status', v)} />
        <DropdownPicker label="Visit Status" value={form.visit_status} options={VISIT_STATUS_OPTIONS} onSelect={v => sf('visit_status', v)} />
        <DropdownPicker label="Interested"   value={form.interested}   options={INTERESTED_OPTIONS}   onSelect={v => sf('interested', v)} />
        <TF label="Pre-Prospect Record Type" value={form.pre_prospect_record_type} onChange={v => sf('pre_prospect_record_type', v)} />
        <TF label="Payee Name"               value={form.payee_name}               onChange={v => sf('payee_name', v)} />

        {/* ── Branch & Depot ── */}
        <SectionHeader title="Branch & Depot" />
        <TF label="Branch Code" value={form.branch_code} onChange={v => sf('branch_code', v)} autoCapitalize="characters" />
        <TF label="Depot Code"  value={form.depot_code}  onChange={v => sf('depot_code', v)}  autoCapitalize="characters" />

        {/* ── Institutional ── */}
        <SectionHeader title="Institutional (if applicable)" />
        <TF label="Industry Type"         value={form.industry_type}         onChange={v => sf('industry_type', v)} />
        <TF label="Industry Sub-Category" value={form.industry_sub_category} onChange={v => sf('industry_sub_category', v)} />
        <TF label="Measure of Potential"  value={form.measure_of_potential}  onChange={v => sf('measure_of_potential', v)} />
        <TF label="No. of Copies"  value={form.number_of_copies}  onChange={v => sf('number_of_copies', v)}  keyboardType="numeric" autoCapitalize="none" />
        <TF label="Period of Contract"    value={form.period_of_contract}    onChange={v => sf('period_of_contract', v)} />
        <TF label="Potential Count"value={form.potential_count}  onChange={v => sf('potential_count', v)}  keyboardType="numeric" autoCapitalize="none" />
        <TF label="Type of Model"         value={form.type_of_model}         onChange={v => sf('type_of_model', v)} />
        <DropdownPicker label="Day of Delivery" value={form.day_of_delivery} options={DELIVERY_OPTIONS} onSelect={v => sf('day_of_delivery', v)} />

        {/* ── Follow-up ── */}
        <SectionHeader title="Follow-up & Actions" />
        <TF label="Next Action Date/Time"  value={form.next_action_datetime}  onChange={v => sf('next_action_datetime', v)}  autoCapitalize="none" placeholder="YYYY-MM-DD HH:MM" />
        <TF label="Next Action Remarks"    value={form.next_action_remarks}   onChange={v => sf('next_action_remarks', v)}   multiline />
        <TF label="Appointment Date/Time"  value={form.appointment_datetime}  onChange={v => sf('appointment_datetime', v)}  autoCapitalize="none" placeholder="YYYY-MM-DD HH:MM" />
        <TF label="Interested On Date"     value={form.interested_on_date}    onChange={v => sf('interested_on_date', v)}    autoCapitalize="none" placeholder="YYYY-MM-DD" />
        <TF label="Reason"                 value={form.reason}                onChange={v => sf('reason', v)} />
        <TF label="Competition"            value={form.competition}           onChange={v => sf('competition', v)} />
        <TF label="Reason for Lost"        value={form.reason_for_lost}       onChange={v => sf('reason_for_lost', v)} />

        {/* ── Preferences ── */}
        <SectionHeader title="Preferences" />
        <ToggleField label="Agree to Terms & Conditions" value={form.agree_terms} onChange={v => sf('agree_terms', v)} />
        <ToggleField label="Opt In (WhatsApp / Email)"   value={form.opt_in}      onChange={v => sf('opt_in', v)} />

        {/* ── Additional ── */}
        <SectionHeader title="Additional" />
        <TF label="Description" value={form.description} onChange={v => sf('description', v)} multiline />
        <TF label="Interest"    value={form.interest}    onChange={v => sf('interest', v)} />

        <View style={[s.btnRow, { marginTop: 20, marginBottom: 40 }]}>
          <TouchableOpacity style={s.primaryBtn} onPress={() => handleSave(isUpdate)} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>{isUpdate ? 'Save' : 'Submit'}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.outlineBtn} onPress={() => setView(isUpdate ? 'detail' : 'list')}>
            <Text style={s.outlineBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── SF-style collapsible section ──────────────────────────────────────
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

// ── SF-style 2-column field row ────────────────────────────────────────
function SFRow({ L, LV, R, RV, onEdit }) {
  return (
    <View style={sd.sfRow}>
      <View style={sd.sfCell}>
        <Text style={sd.sfCellLabel}>{L}</Text>
        <View style={sd.sfCellValueRow}>
          <Text style={sd.sfCellValue} numberOfLines={2}>{LV || ''}</Text>
          <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={sd.sfEditIcon}>✎</Text>
          </TouchableOpacity>
        </View>
      </View>
      {!!R && (
        <View style={[sd.sfCell, { borderLeftWidth: 1, borderLeftColor: '#e8ecf0', paddingLeft: 12 }]}>
          <Text style={sd.sfCellLabel}>{R}</Text>
          <View style={sd.sfCellValueRow}>
            <Text style={sd.sfCellValue} numberOfLines={2}>{RV || ''}</Text>
            <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={sd.sfEditIcon}>✎</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Status / Rating badge helpers ────────────────────────────────────
const STATUS_COLORS = {
  New:         { bg: '#e8f4fd', text: '#0070d2' },
  Working:     { bg: '#fff3cd', text: '#856404' },
  Nurturing:   { bg: '#e8f5e9', text: '#2e7d32' },
  Unqualified: { bg: '#fce8e6', text: '#c0392b' },
  Qualified:   { bg: '#d4edda', text: '#1a7431' },
};
const RATING_COLORS = {
  Hot:  { bg: '#fce8e6', text: '#c0392b' },
  Warm: { bg: '#fff3cd', text: '#856404' },
  Cold: { bg: '#e8f4fd', text: '#0070d2' },
};
function statusStyle(status) {
  const c = STATUS_COLORS[status] || { bg: '#f0f0f0', text: '#444' };
  return { fontSize: 11, fontWeight: '600', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: c.bg, color: c.text, alignSelf: 'flex-start' };
}

// ── Styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff', padding: 16 },
  tagRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tag:          { borderWidth: 1, borderColor: '#0070d2', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 3 },
  tagGray:      { borderColor: '#5c5c5c' },
  tagRed:       { borderColor: '#c0392b' },
  tagText:      { color: '#0070d2', fontWeight: '600', fontSize: 12 },
  tagTextGray:  { color: '#5c5c5c' },
  tagTextRed:   { color: '#c0392b' },
  pageTitle:    { fontSize: 18, fontWeight: '700', color: '#16325c', marginBottom: 2 },
  pageSubtitle: { fontSize: 13, color: '#706e6b', marginBottom: 16 },

  listHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  searchRow:    { flex: 1, flexDirection: 'row', borderWidth: 1, borderColor: '#d8dde6', borderRadius: 4, overflow: 'hidden' },
  searchInput:  { flex: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#16325c' },
  searchBtn:    { backgroundColor: '#0070d2', paddingHorizontal: 14, justifyContent: 'center' },
  searchBtnText:{ color: '#fff', fontSize: 13, fontWeight: '600' },
  newBtn:       { backgroundColor: '#0070d2', borderRadius: 4, paddingHorizontal: 16, paddingVertical: 10 },
  newBtnText:   { color: '#fff', fontSize: 13, fontWeight: '700' },
  listSubtitle: { fontSize: 12, color: '#706e6b', marginBottom: 8 },

  tableHeader:  { flexDirection: 'row', backgroundColor: '#f4f6f9', paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 2, borderBottomColor: '#d8dde6' },
  th:           { fontSize: 11, fontWeight: '700', color: '#444', textTransform: 'uppercase' },
  tableRow:     { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center' },
  tdLink:       { fontSize: 13, color: '#0070d2', fontWeight: '600' },
  tdSub:        { fontSize: 11, color: '#706e6b' },
  td:           { fontSize: 13, color: '#16325c' },
  tdRating:     (r) => { const c = RATING_COLORS[r]; return { fontSize: 11, fontWeight: '700', color: c?.text || '#444' }; },
  emptyBox:     { alignItems: 'center', paddingTop: 40 },
  emptyIcon:    { fontSize: 40, marginBottom: 10 },
  emptyText:    { fontSize: 14, color: '#706e6b' },

  detailSection:      { marginBottom: 0 },
  detailSectionTitle: { fontSize: 13, fontWeight: '700', color: '#0070d2' },
  detailGrid:         { flexDirection: 'row', flexWrap: 'wrap' },
  detailField:        { width: '50%', paddingRight: 8, marginBottom: 12 },
  detailFieldLabel:   { fontSize: 11, color: '#706e6b', marginBottom: 2 },
  detailFieldValue:   { fontSize: 13, fontWeight: '600', color: '#16325c' },

  btnRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  primaryBtn:   { backgroundColor: '#0070d2', borderRadius: 4, paddingHorizontal: 24, paddingVertical: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  outlineBtn:   { borderWidth: 1, borderColor: '#0070d2', borderRadius: 4, paddingHorizontal: 14, paddingVertical: 8 },
  outlineBtnText: { color: '#0070d2', fontSize: 13, fontWeight: '600' },
});

// ── Salesforce Detail View Styles ────────────────────────────────────
const sd = StyleSheet.create({
  headerCard: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecf0',
    elevation: 2,
  },
  headerTop:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  starBox:     { width: 36, height: 36, borderRadius: 6, backgroundColor: '#2a9d5c', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  starIcon:    { color: '#fff', fontSize: 18, fontWeight: '700' },
  leadLabel:   { fontSize: 11, color: '#706e6b', marginBottom: 2 },
  leadName:    { fontSize: 17, fontWeight: '700', color: '#16325c' },
  followBtn:   { borderWidth: 1.5, borderColor: '#0070d2', borderRadius: 4, paddingHorizontal: 14, paddingVertical: 6 },
  followBtnText: { fontSize: 13, fontWeight: '600', color: '#0070d2' },
  quickBar:    { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  quickItem:   { minWidth: 80 },
  quickLabel:  { fontSize: 11, color: '#706e6b', marginBottom: 2 },
  quickLink:   { fontSize: 13, fontWeight: '600', color: '#0070d2' },
  quickValue:  { fontSize: 13, fontWeight: '600', color: '#16325c' },
  tabBar:      { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e8ecf0' },
  tabBtn:      { paddingHorizontal: 20, paddingVertical: 12, position: 'relative', alignItems: 'center' },
  tabLabel:    { fontSize: 14, fontWeight: '500', color: '#706e6b' },
  tabLabelActive: { color: '#0070d2', fontWeight: '700' },
  tabUnderline: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: '#0070d2', borderRadius: 2 },
  section:       { backgroundColor: '#fff', marginTop: 10, marginHorizontal: 10, borderRadius: 6, overflow: 'hidden', elevation: 1, borderWidth: 1, borderColor: '#e8ecf0' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f6f9', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e8ecf0' },
  sectionChevron:{ fontSize: 15, color: '#706e6b', marginRight: 8, width: 16 },
  sectionTitle:  { fontSize: 13, fontWeight: '700', color: '#16325c' },
  sectionBody:   {},
  sfRow:         { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f0f2f5' },
  sfCell:        { flex: 1, paddingHorizontal: 14, paddingVertical: 10 },
  sfCellLabel:   { fontSize: 11, color: '#706e6b', marginBottom: 3 },
  sfCellValueRow:{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  sfCellValue:   { flex: 1, fontSize: 13, color: '#16325c', fontWeight: '500' },
  sfEditIcon:    { fontSize: 14, color: '#c0c0c0', marginLeft: 4 },
  relatedSection:{ backgroundColor: '#fff', margin: 10, borderRadius: 6, overflow: 'hidden', elevation: 1, borderWidth: 1, borderColor: '#e8ecf0' },
  relatedHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#e8ecf0', backgroundColor: '#f4f6f9' },
  relatedIconBox:{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#d44280', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  relatedTitle:  { fontSize: 14, fontWeight: '700', color: '#16325c' },
  relatedTableHead: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e8ecf0', backgroundColor: '#fafbfc' },
  relatedTH:     { fontSize: 11, fontWeight: '700', color: '#444', textTransform: 'uppercase' },
  relatedEmpty:  { padding: 20, alignItems: 'center' },
  relatedEmptyText: { fontSize: 13, color: '#706e6b' },
});

// ── Record Type Modal Styles ─────────────────────────────────────────
const rt = StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card:         { backgroundColor: '#fff', borderRadius: 8, width: '100%', maxHeight: '82%', elevation: 10 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  title:        { fontSize: 18, fontWeight: '700', color: '#16325c' },
  closeText:    { fontSize: 18, color: '#706e6b', padding: 4 },
  divider:      { height: 1, backgroundColor: '#e0e0e0' },
  body:         { paddingHorizontal: 20, paddingVertical: 14 },
  selectLabel:  { fontSize: 13, color: '#706e6b', marginBottom: 14 },
  optionRow:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  radio:        { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#d8dde6', alignItems: 'center', justifyContent: 'center', marginTop: 2, marginRight: 14 },
  radioSelected:{ borderColor: '#0070d2' },
  radioDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0070d2' },
  optionText:   { flex: 1 },
  optionTitle:  { fontSize: 15, fontWeight: '600', color: '#16325c', marginBottom: 3 },
  optionDesc:   { fontSize: 12, color: '#706e6b', lineHeight: 17 },
  footer:       { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, paddingHorizontal: 20, paddingVertical: 14 },
  cancelBtn:    { borderWidth: 1, borderColor: '#d8dde6', borderRadius: 4, paddingHorizontal: 20, paddingVertical: 9 },
  cancelBtnText:{ fontSize: 14, color: '#16325c', fontWeight: '600' },
  nextBtn:      { backgroundColor: '#0070d2', borderRadius: 4, paddingHorizontal: 24, paddingVertical: 9 },
  nextBtnText:  { fontSize: 14, color: '#fff', fontWeight: '700' },
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
  pickerItemText: { fontSize: 14, color: '#16325c' },
  sectionWrap:  { flexDirection: 'row', alignItems: 'center', marginVertical: 14 },
  sectionLine:  { flex: 1, height: 1, backgroundColor: '#d8dde6' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#0070d2', textTransform: 'uppercase', paddingHorizontal: 10 },
  toggleWrap:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingVertical: 4 },
});
