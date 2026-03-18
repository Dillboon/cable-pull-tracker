import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  Image, StyleSheet, Alert, Modal, ScrollView,
  Dimensions, TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { COLORS } from '../theme';

const SCREEN_W = Dimensions.get('window').width;
const PRINTS_DIR = FileSystem.documentDirectory + 'prints/';

const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(PRINTS_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(PRINTS_DIR, { intermediates: true });
}

export default function PrintsScreen({ prints, updatePrints, project }) {
  const [category,     setCategory]     = useState('blueprints'); // 'blueprints' | 'photos'
  const [viewing,      setViewing]      = useState(null);
  const [editingName,  setEditingName]  = useState(false);
  const [nameInput,    setNameInput]    = useState('');

  const filtered = prints.filter(p => p.category === category);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photo library in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled) return;

    await ensureDir();
    const newPrints = [];
    for (const asset of result.assets) {
      const filename = `${uid()}.jpg`;
      const dest = PRINTS_DIR + filename;
      await FileSystem.copyAsync({ from: asset.uri, to: dest });
      newPrints.push({
        id:       uid(),
        name:     asset.fileName?.replace(/\.[^.]+$/, '') || `${category === 'blueprints' ? 'Blueprint' : 'Photo'} ${prints.length + newPrints.length + 1}`,
        uri:      dest,
        category,
        addedAt:  today(),
      });
    }
    updatePrints([...prints, ...newPrints]);
  };

  const deletePrint = async (id) => {
    const print = prints.find(p => p.id === id);
    Alert.alert(
      'Delete',
      `Delete "${print?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try { await FileSystem.deleteAsync(print.uri, { idempotent: true }); } catch {}
          updatePrints(prints.filter(p => p.id !== id));
          if (viewing?.id === id) setViewing(null);
        }},
      ]
    );
  };

  const saveName = () => {
    if (!nameInput.trim()) { setEditingName(false); return; }
    const updated = { ...viewing, name: nameInput.trim() };
    updatePrints(prints.map(p => p.id === viewing.id ? updated : p));
    setViewing(updated);
    setEditingName(false);
  };

  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={s.card}
      onPress={() => setViewing(item)}
      onLongPress={() => deletePrint(item.id)}
      activeOpacity={0.75}
    >
      <Image source={{ uri: item.uri }} style={s.thumb} resizeMode="cover" />
      <View style={{ flex: 1, paddingVertical: 2 }}>
        <Text style={s.cardName} numberOfLines={2}>{item.name}</Text>
        <Text style={s.cardMeta}>{item.category === 'blueprints' ? 'Blueprint' : 'Job Photo'} · {item.addedAt}</Text>
      </View>
      <TouchableOpacity onPress={() => deletePrint(item.id)} style={s.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={s.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>

      {/* Category toggle */}
      <View style={s.toggleRow}>
        <TouchableOpacity
          style={[s.toggleBtn, category === 'blueprints' && s.toggleBtnActive]}
          onPress={() => setCategory('blueprints')}
          activeOpacity={0.8}
        >
          <Text style={[s.toggleBtnText, category === 'blueprints' && { color: COLORS.blue }]}>
            📐 Blueprints ({prints.filter(p => p.category === 'blueprints').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.toggleBtn, category === 'photos' && s.toggleBtnActive]}
          onPress={() => setCategory('photos')}
          activeOpacity={0.8}
        >
          <Text style={[s.toggleBtnText, category === 'photos' && { color: COLORS.amber }]}>
            📷 Job Photos ({prints.filter(p => p.category === 'photos').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderCard}
        contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 44 }}>{category === 'blueprints' ? '📐' : '📷'}</Text>
            <Text style={s.emptyTitle}>No {category === 'blueprints' ? 'blueprints' : 'job photos'} yet</Text>
            <Text style={s.emptyHint}>Tap the button below to add from your photo library</Text>
          </View>
        }
      />

      {/* Add button */}
      <View style={s.fab}>
        <TouchableOpacity style={[s.fabBtn, category === 'blueprints' ? s.fabBlue : s.fabAmber]} onPress={pickImage} activeOpacity={0.85}>
          <Text style={s.fabText}>
            + Add {category === 'blueprints' ? 'Blueprint' : 'Job Photo'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Full screen viewer */}
      <Modal visible={!!viewing} transparent animationType="fade" onRequestClose={() => setViewing(null)}>
        <View style={s.modalBg}>
          {/* Viewer header */}
          <View style={s.viewerHeader}>
            {editingName ? (
              <View style={{ flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TextInput
                  value={nameInput}
                  onChangeText={setNameInput}
                  style={s.nameInput}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={saveName}
                />
                <TouchableOpacity onPress={saveName} style={s.saveNameBtn}>
                  <Text style={{ color: COLORS.blue, fontWeight: '800', fontSize: 13 }}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={{ flex: 1 }} onPress={() => { setNameInput(viewing?.name || ''); setEditingName(true); }}>
                <Text style={s.viewerName} numberOfLines={1}>{viewing?.name}</Text>
                <Text style={s.viewerMeta}>Tap name to edit · {viewing?.addedAt}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => { setViewing(null); setEditingName(false); }} style={s.closeBtn}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Image */}
          {viewing && (
            <ScrollView
              maximumZoomScale={5}
              minimumZoomScale={1}
              centerContent
              style={{ flex: 1 }}
              contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            >
              <Image
                source={{ uri: viewing.uri }}
                style={{ width: SCREEN_W, height: SCREEN_W * 1.4 }}
                resizeMode="contain"
              />
            </ScrollView>
          )}

          {/* Delete from viewer */}
          <View style={s.viewerFooter}>
            <TouchableOpacity
              onPress={() => viewing && deletePrint(viewing.id)}
              style={s.viewerDeleteBtn}
              activeOpacity={0.8}
            >
              <Text style={s.viewerDeleteText}>🗑  Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  toggleBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: COLORS.blueDim,
    borderColor: 'rgba(59,130,246,0.4)',
  },
  toggleBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    marginBottom: 10,
    padding: 10,
    gap: 12,
  },
  thumb: {
    width: 72, height: 72,
    borderRadius: 6,
    backgroundColor: COLORS.surface2,
  },
  cardName: {
    fontSize: 14, fontWeight: '700', color: COLORS.text,
    marginBottom: 4, flexShrink: 1,
  },
  cardMeta: { fontSize: 11, color: COLORS.textMuted },
  deleteBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
    borderRadius: 5, width: 28, height: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnText: { color: '#f87171', fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textDim },
  emptyHint:  { fontSize: 12, color: COLORS.textDim, textAlign: 'center', paddingHorizontal: 40 },
  fab: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 12, paddingBottom: 16,
    backgroundColor: 'rgba(13,17,23,0.95)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  fabBtn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  fabBlue:  { backgroundColor: '#1d4ed8', elevation: 6 },
  fabAmber: { backgroundColor: '#92400e', elevation: 6 },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 0.4 },
  modalBg: {
    flex: 1, backgroundColor: '#000',
  },
  viewerHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  viewerName: { fontSize: 15, fontWeight: '800', color: '#fff' },
  viewerMeta: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  nameInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 7, padding: 8,
    color: '#fff', fontSize: 14,
  },
  saveNameBtn: {
    backgroundColor: COLORS.blueDim,
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.4)',
    borderRadius: 7, paddingHorizontal: 12, paddingVertical: 8,
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18, width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  viewerFooter: {
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
  },
  viewerDeleteBtn: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 8, padding: 12, alignItems: 'center',
  },
  viewerDeleteText: { color: '#f87171', fontWeight: '800', fontSize: 13 },
});
