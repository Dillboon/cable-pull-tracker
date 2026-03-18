import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import DropCard from '../components/DropCard';
import BulkImportModal from '../components/BulkImportModal';
import { COLORS } from '../theme';

const STATUS_FILTERS = [
  { key: 'ALL',        label: 'All'         },
  { key: 'COMPLETE',   label: 'Complete'    },
  { key: 'INCOMPLETE', label: 'Incomplete'  },
  { key: 'ROUGH_ONLY', label: 'Pulled Only' },
];

// Extract the first number found anywhere in a string e.g. "C-042" → 42
const extractNum = (str) => {
  const match = String(str || '').match(/\d+/);
  return match ? parseInt(match[0], 10) : 9999;
};

// For a drop, the sort key is the lowest cable number it contains
const sortKey = (drop) => {
  const a = extractNum(drop.cableA);
  const b = drop.isDouble ? extractNum(drop.cableB) : 9999;
  return Math.min(a, b);
};

const sortDrops = (arr) => [...arr].sort((a, b) => {
  // Sort by IDF first (alphabetical, empty IDF goes last)
  const idfA = a.idf ? a.idf.toLowerCase() : 'zzz';
  const idfB = b.idf ? b.idf.toLowerCase() : 'zzz';
  if (idfA < idfB) return -1;
  if (idfA > idfB) return 1;
  // Then by lowest cable number
  return sortKey(a) - sortKey(b);
});

export default function DropsScreen({ drops, idfList, addDrop, bulkAddDrops, updateDrop, deleteDrop }) {
  const [filterIdf,    setFilterIdf]    = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search,       setSearch]       = useState('');
  const [showBulk,     setShowBulk]     = useState(false);

<<<<<<< HEAD
  // ── Debounced display drops ───────────────────────────────────────────────
  // Waits 1.5s after the last change before re-sorting, so cards don't
  // jump around while the user is actively typing a cable ID.
  const [displayDrops, setDisplayDrops] = useState(() => drops);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDisplayDrops(drops);
    }, 1500);
    return () => clearTimeout(debounceRef.current);
  }, [drops]);

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => sortDrops(
    displayDrops.filter(d => {
=======
  // ── Filter + sort ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => sortDrops(
    drops.filter(d => {
>>>>>>> 56471c6fa060d357d74c8d243d443aa84461e961
      if (filterIdf !== 'ALL' && d.idf !== filterIdf) return false;
      if (filterStatus === 'COMPLETE'   && !(d.roughPull && d.terminated && d.tested)) return false;
      if (filterStatus === 'INCOMPLETE' &&  (d.roughPull && d.terminated && d.tested)) return false;
      if (filterStatus === 'ROUGH_ONLY' && (!d.roughPull || d.terminated || d.tested)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !d.cableA.toLowerCase().includes(q) &&
          !d.cableB.toLowerCase().includes(q) &&
          !d.notes.toLowerCase().includes(q) &&
          !d.idf.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    })
<<<<<<< HEAD
  ), [displayDrops, filterIdf, filterStatus, search]);
=======
  ), [drops, filterIdf, filterStatus, search]);
>>>>>>> 56471c6fa060d357d74c8d243d443aa84461e961

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Filters */}
      <View style={s.filterBox}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="🔍  Search cable IDs, IDF, notes…"
          placeholderTextColor={COLORS.textDim}
          style={s.searchInput}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {['ALL', ...idfList].map(idf => (
            <TouchableOpacity
              key={idf}
              onPress={() => setFilterIdf(idf)}
              style={[s.chip, filterIdf === idf && s.chipAmber]}
            >
              <Text style={[s.chipText, filterIdf === idf && { color: COLORS.amber }]}>{idf}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
          {STATUS_FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilterStatus(f.key)}
              style={[s.chip, filterStatus === f.key && s.chipBlue]}
            >
              <Text style={[s.chipText, filterStatus === f.key && { color: COLORS.blue }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Drop list */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <DropCard drop={item} onUpdate={updateDrop} onDelete={deleteDrop} idfList={idfList} />
        )}
        contentContainerStyle={{ padding: 12, paddingBottom: 130 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 44 }}>🔌</Text>
            <Text style={s.emptyTitle}>No drops found</Text>
            <Text style={s.emptyHint}>Tap a button below to add your first cable drop</Text>
          </View>
        }
        keyboardShouldPersistTaps="handled"
      />

      {/* Bulk import modal */}
      <BulkImportModal
        visible={showBulk}
        onClose={() => setShowBulk(false)}
        onImport={bulkAddDrops}
        idfList={idfList}
      />

      {/* Floating add buttons */}
      <View style={s.fab}>
        <TouchableOpacity style={[s.fabBtn, s.fabBlue]}   onPress={() => addDrop(false)}    activeOpacity={0.85}>
          <Text style={s.fabText}>+ SINGLE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.fabBtn, s.fabPurple]} onPress={() => addDrop(true)}     activeOpacity={0.85}>
          <Text style={s.fabText}>⟷ DOUBLE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.fabBtn, s.fabGreen]}  onPress={() => setShowBulk(true)} activeOpacity={0.85}>
          <Text style={s.fabText}>⬇ BULK</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  filterBox: {
    backgroundColor: COLORS.bg,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 8, padding: 10,
    color: COLORS.text, fontSize: 13,
  },
  chip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'transparent', marginRight: 6,
  },
  chipAmber: { backgroundColor: COLORS.amberDim, borderColor: 'rgba(245,158,11,0.4)' },
  chipBlue:  { backgroundColor: COLORS.blueDim,  borderColor: 'rgba(59,130,246,0.4)'  },
  chipText:  { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.4 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textDim },
  emptyHint:  { fontSize: 12, color: COLORS.textDim, textAlign: 'center', paddingHorizontal: 40 },
  fab: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 8, padding: 10, paddingBottom: 14,
    backgroundColor: 'rgba(13,17,23,0.95)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  fabBtn:    { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  fabBlue:   { backgroundColor: '#1d4ed8', elevation: 6 },
  fabPurple: { backgroundColor: '#5b21b6', elevation: 6 },
  fabGreen:  { backgroundColor: '#166834', elevation: 6 },
  fabText:   { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 0.4 },
});
