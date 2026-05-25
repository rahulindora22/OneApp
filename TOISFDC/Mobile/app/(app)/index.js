import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import RWAScreen      from '../../src/screens/RWAScreen';
import OOHScreen      from '../../src/screens/OOHScreen';
import CSPScreen      from '../../src/screens/CSPScreen';
import DepoScreen     from '../../src/screens/DepoScreen';
import LeadScreen     from '../../src/screens/LeadScreen';
import CampaignScreen      from '../../src/screens/CampaignScreen';
import PromotionLeadScreen from '../../src/screens/PromotionLeadScreen';

const MAIN_TABS = [
  { key: 'HOME',     label: 'Home',            icon: 'home' },
  { key: 'ONEAPP',   label: 'One App',         icon: 'apps' },
  { key: 'LEAD',     label: 'Leads',           icon: 'person-add' },
  { key: 'CAMPAIGN', label: 'Campaigns',       icon: 'campaign' },
  { key: 'PLN',      label: 'Promotion Leads', icon: 'assignment' },
];

const ONEAPP_MODULES = [
  {
    key:         'RWA',
    label:       'RWA',
    fullName:    'Residential Welfare Associations',
    icon:        'apartment',
    color:       '#1565C0',
    lightColor:  '#E3F0FF',
    accentColor: '#1976D2',
    description: 'Manage society segments, localities & delivery points',
  },
  {
    key:         'OOH',
    label:       'OOH',
    fullName:    'Out of Home',
    icon:        'campaign',
    color:       '#6A1B9A',
    lightColor:  '#F3E5F5',
    accentColor: '#7B1FA2',
    description: 'Hoarding, banner & outdoor advertising segments',
  },
  {
    key:         'CSP',
    label:       'CSP',
    fullName:    'Customer Service Points',
    icon:        'storefront',
    color:       '#1B6B3A',
    lightColor:  '#E8F5E9',
    accentColor: '#2E7D32',
    description: 'Retail counters, kiosks & customer service outlets',
  },
  {
    key:         'DEPOT',
    label:       'DEPOT',
    fullName:    'Depot Management',
    icon:        'local-shipping',
    color:       '#BF360C',
    lightColor:  '#FBE9E7',
    accentColor: '#D84315',
    description: 'Distribution depots, check-in & delivery tracking',
  },
];

export default function AppIndex() {
  const [mainTab,    setMainTab]    = useState('HOME');
  const [activeModule, setModule]  = useState(null); // null = launcher
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();

  function confirmLogout() {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Logout', onPress: logout, style: 'destructive' },
    ]);
  }

  function switchMainTab(key) {
    setMainTab(key);
    if (key === 'ONEAPP') setModule(null);
  }

  const mod = ONEAPP_MODULES.find(m => m.key === activeModule);

  return (
    <View style={styles.root}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.brandRow}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>TOI</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.brandTitle}>BCCL – RMD</Text>
          </View>
          <TouchableOpacity onPress={confirmLogout} style={styles.logoutBtn}>
            <MaterialIcons name="logout" size={20} color="#a8c0e8" />
          </TouchableOpacity>
        </View>

        {/* Main nav tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mainTabRow}>
          {MAIN_TABS.map((tab) => {
            const active = mainTab === tab.key;
            return (
              <TouchableOpacity key={tab.key} style={styles.mainTab} onPress={() => switchMainTab(tab.key)} activeOpacity={0.75}>
                <Text style={[styles.mainTabLabel, active && styles.mainTabLabelActive]}>{tab.label}</Text>
                {active && <View style={styles.mainTabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Content ─────────────────────────────────────────────────── */}

      {mainTab === 'HOME' && (
        <View style={styles.placeholder}>
          <MaterialIcons name="home" size={52} color="#d8dde6" />
          <Text style={styles.placeholderTitle}>Welcome to BCCL – RMD</Text>
          <Text style={styles.placeholderSub}>Home dashboard is under development.</Text>
        </View>
      )}

      {mainTab === 'ONEAPP' && !activeModule && (
        <OneAppLauncher onSelect={setModule} />
      )}

      {mainTab === 'ONEAPP' && !!activeModule && (
        <View style={styles.screen}>
          {/* Module sub-header */}
          <View style={[styles.moduleBar, { backgroundColor: mod.color }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setModule(null)}>
              <MaterialIcons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <MaterialIcons name={mod.icon} size={20} color="rgba(255,255,255,0.85)" style={{ marginRight: 8 }} />
            <View>
              <Text style={styles.moduleBarTitle}>{mod.label}</Text>
              <Text style={styles.moduleBarSub}>{mod.fullName}</Text>
            </View>
          </View>
          {activeModule === 'RWA'   && <RWAScreen  />}
          {activeModule === 'OOH'   && <OOHScreen  />}
          {activeModule === 'CSP'   && <CSPScreen  />}
          {activeModule === 'DEPOT' && <DepoScreen />}
        </View>
      )}

      {mainTab === 'LEAD'     && <View style={styles.screen}><LeadScreen /></View>}
      {mainTab === 'CAMPAIGN' && <View style={styles.screen}><CampaignScreen /></View>}
      {mainTab === 'PLN'      && <View style={styles.screen}><PromotionLeadScreen /></View>}
    </View>
  );
}

// ── One App Launcher ─────────────────────────────────────────────────
function OneAppLauncher({ onSelect }) {
  return (
    <ScrollView style={launcher.scroll} contentContainerStyle={launcher.container} showsVerticalScrollIndicator={false}>
      {/* Section title */}
      <View style={launcher.sectionHead}>
        <MaterialIcons name="apps" size={18} color="#16325c" style={{ marginRight: 6 }} />
        <Text style={launcher.sectionTitle}>One App Modules</Text>
      </View>
      <Text style={launcher.sectionSub}>Select a module to get started</Text>

      {/* 2-column card grid */}
      <View style={launcher.grid}>
        {ONEAPP_MODULES.map((mod) => (
          <TouchableOpacity
            key={mod.key}
            style={[launcher.card, { borderTopColor: mod.color }]}
            onPress={() => onSelect(mod.key)}
            activeOpacity={0.82}
          >
            {/* Icon circle */}
            <View style={[launcher.iconCircle, { backgroundColor: mod.lightColor }]}>
              <MaterialIcons name={mod.icon} size={28} color={mod.color} />
            </View>

            {/* Label row */}
            <View style={launcher.labelRow}>
              <Text style={[launcher.cardLabel, { color: mod.color }]}>{mod.label}</Text>
              <View style={[launcher.badge, { backgroundColor: mod.lightColor }]}>
                <MaterialIcons name="chevron-right" size={14} color={mod.color} />
              </View>
            </View>

            <Text style={launcher.cardFullName}>{mod.fullName}</Text>
            <Text style={launcher.cardDesc} numberOfLines={2}>{mod.description}</Text>

            {/* Bottom accent bar */}
            <View style={[launcher.accentBar, { backgroundColor: mod.color }]} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f3f8' },

  header: {
    backgroundColor: '#16325c',
    paddingHorizontal: 16,
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  brandRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  logoBox:    { width: 36, height: 36, borderRadius: 6, backgroundColor: '#e8303a', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  logoText:   { color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
  brandTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  logoutBtn:  { padding: 6 },

  mainTabRow:        { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  mainTab:           { paddingHorizontal: 14, paddingVertical: 10, marginRight: 2, position: 'relative', alignItems: 'center' },
  mainTabLabel:      { fontSize: 13, fontWeight: '600', color: 'rgba(200,216,240,0.75)' },
  mainTabLabelActive:{ color: '#fff' },
  mainTabUnderline:  { position: 'absolute', bottom: 0, left: 8, right: 8, height: 3, borderRadius: 2, backgroundColor: '#fff' },

  screen:          { flex: 1 },
  moduleBar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  backBtn:         { marginRight: 12, padding: 4 },
  moduleBarTitle:  { fontSize: 14, fontWeight: '700', color: '#fff' },
  moduleBarSub:    { fontSize: 11, color: 'rgba(255,255,255,0.75)' },

  placeholder:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  placeholderTitle: { fontSize: 20, fontWeight: '700', color: '#444', marginTop: 16 },
  placeholderSub:   { fontSize: 14, color: '#706e6b', marginTop: 6, textAlign: 'center' },
});

const launcher = StyleSheet.create({
  scroll:       { flex: 1 },
  container:    { padding: 16, paddingBottom: 32 },
  sectionHead:  { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#16325c' },
  sectionSub:   { fontSize: 13, color: '#706e6b', marginBottom: 16 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    overflow: 'hidden',
  },

  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  labelRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardLabel:    { fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  badge:        { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cardFullName: { fontSize: 12, fontWeight: '600', color: '#16325c', marginBottom: 4 },
  cardDesc:     { fontSize: 11, color: '#706e6b', lineHeight: 16 },
  accentBar:    { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },
});
