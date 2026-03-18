import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Card, CardHeader, Badge, Button, BottomSheet, Input } from '../components/UI';
import { useAuth } from '../hooks/useAuth';
import { subscribeDocuments, addDocumentMeta, deleteDocumentMeta } from '../firebase/firestore';
import { storage } from '../firebase/config';
import { colors, spacing, radius } from '../utils/theme';
import { format } from 'date-fns';

const CATEGORIES = ['All', 'Home', 'Finance', 'Medical', 'Important', 'Other'];
const CAT_COLORS = { Home: 'partner', Finance: 'dueSoon', Medical: 'default', Important: 'you', Other: 'default' };
const CAT_ICONS = { Home: '🏠', Finance: '💰', Medical: '🩺', Important: '⭐', Other: '📄' };

export default function DocumentsScreen() {
  const { user, household } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [filter, setFilter] = useState('All');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [form, setForm] = useState({ name: '', category: 'Home', notes: '' });
  const [pendingFile, setPendingFile] = useState(null);

  useEffect(() => {
    if (!household?.id) return;
    return subscribeDocuments(household.id, setDocuments);
  }, [household?.id]);

  const filtered = filter === 'All' ? documents : documents.filter(d => d.category === filter);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets[0];
      setPendingFile(file);
      setForm(f => ({ ...f, name: file.name.replace(/\.[^.]+$/, '') }));
      setSheetVisible(true);
    } catch (err) {
      Alert.alert('Error', 'Could not pick file.');
    }
  };

  const handleUpload = async () => {
    if (!form.name.trim()) return Alert.alert('Name required', 'Please give this document a name.');
    setUploading(true);
    try {
      let downloadURL = null;
      if (pendingFile) {
        const response = await fetch(pendingFile.uri);
        const blob = await response.blob();
        const storageRef = ref(storage, `households/${household.id}/documents/${Date.now()}_${pendingFile.name}`);
        const task = uploadBytesResumable(storageRef, blob);
        await new Promise((resolve, reject) => {
          task.on('state_changed',
            snap => setUploadProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
            reject,
            () => resolve()
          );
        });
        downloadURL = await getDownloadURL(task.snapshot.ref);
      }
      await addDocumentMeta(household.id, {
        name: form.name.trim(),
        category: form.category,
        notes: form.notes.trim(),
        fileName: pendingFile?.name || form.name,
        fileSize: pendingFile?.size,
        mimeType: pendingFile?.mimeType,
        downloadURL,
        uploadedByName: user.displayName || user.email,
      });
      setSheetVisible(false);
      setPendingFile(null);
      setUploadProgress(0);
    } catch (err) {
      Alert.alert('Upload failed', err.message);
    }
    setUploading(false);
  };

  const handleDelete = (docItem) => {
    Alert.alert('Delete document', `Remove "${docItem.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteDocumentMeta(household.id, docItem.id);
          if (docItem.downloadURL) {
            try {
              const fileRef = ref(storage, docItem.downloadURL);
              await deleteObject(fileRef);
            } catch (_) {}
          }
        }
      }
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ padding: spacing.sm }}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat} style={[styles.filterChip, filter === cat && styles.filterChipActive]} onPress={() => setFilter(cat)}>
            <Text style={[styles.filterText, filter === cat && styles.filterTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Button label="+ Upload document" onPress={pickDocument} style={{ marginBottom: spacing.md }}/>
        <Button label="+ Add link or note" onPress={() => { setPendingFile(null); setForm({ name: '', category: 'Home', notes: '' }); setSheetVisible(true); }} variant="secondary" style={{ marginBottom: spacing.lg }}/>

        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>No {filter === 'All' ? '' : filter.toLowerCase() + ' '}documents yet — upload one above</Text>
        ) : (
          <View style={styles.docGrid}>
            {filtered.map(doc => (
              <TouchableOpacity key={doc.id} style={styles.docCard} onLongPress={() => handleDelete(doc)}>
                <Text style={styles.docIcon}>{CAT_ICONS[doc.category] || '📄'}</Text>
                <Text style={styles.docName} numberOfLines={2}>{doc.name}</Text>
                <Badge label={doc.category} type={CAT_COLORS[doc.category] || 'default'}/>
                <Text style={styles.docMeta}>
                  {doc.uploadedByName} · {doc.createdAt?.toDate ? format(doc.createdAt.toDate(), 'd MMM yyyy') : ''}
                </Text>
                {doc.notes ? <Text style={styles.docNotes} numberOfLines={1}>{doc.notes}</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <BottomSheet visible={sheetVisible} onClose={() => { setSheetVisible(false); setPendingFile(null); }} title={pendingFile ? 'Upload document' : 'Add document'}>
        {pendingFile && (
          <View style={styles.filePreview}>
            <Text style={{ fontSize: 22 }}>📎</Text>
            <Text style={styles.fileName} numberOfLines={1}>{pendingFile.name}</Text>
          </View>
        )}

        <Input label="Document name" value={form.name} onChangeText={t => setForm(f => ({ ...f, name: t }))} placeholder="e.g. Tenancy agreement"/>

        <Text style={styles.catLabel}>Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md }}>
          {CATEGORIES.filter(c => c !== 'All').map(cat => (
            <TouchableOpacity key={cat} style={[styles.catBtn, form.category === cat && styles.catBtnActive]} onPress={() => setForm(f => ({ ...f, category: cat }))}>
              <Text style={styles.catBtnEmoji}>{CAT_ICONS[cat]}</Text>
              <Text style={[styles.catBtnText, form.category === cat && { color: colors.white }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input label="Notes (optional)" value={form.notes} onChangeText={t => setForm(f => ({ ...f, notes: t }))} placeholder="e.g. Expires Oct 2026" multiline numberOfLines={2}/>

        {uploading && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${uploadProgress}%` }]}/>
            <Text style={styles.progressText}>{uploadProgress}%</Text>
          </View>
        )}

        <Button label={uploading ? `Uploading... ${uploadProgress}%` : 'Save document'} onPress={handleUpload} loading={uploading} style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}/>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  filterBar: { flexGrow: 0, backgroundColor: colors.warmWhite, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, marginRight: 8, borderWidth: 1.5, borderColor: 'transparent', backgroundColor: colors.sand },
  filterChipActive: { backgroundColor: colors.rust, borderColor: colors.rust },
  filterText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  filterTextActive: { color: colors.white },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic', marginTop: spacing.xl },
  docGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  docCard: {
    width: '47%', backgroundColor: colors.warmWhite, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  docIcon: { fontSize: 28, marginBottom: 8 },
  docName: { fontSize: 14, fontWeight: '700', color: colors.darkBrown, marginBottom: 6, lineHeight: 18 },
  docMeta: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  docNotes: { fontSize: 12, color: colors.textSecondary, marginTop: 4, fontStyle: 'italic' },
  filePreview: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.sand, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  fileName: { flex: 1, fontSize: 13, color: colors.textPrimary },
  catLabel: { fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600', marginBottom: 8 },
  catBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.warmWhite },
  catBtnActive: { backgroundColor: colors.rust, borderColor: colors.rust },
  catBtnEmoji: { fontSize: 14 },
  catBtnText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  progressBar: { height: 8, backgroundColor: colors.sand, borderRadius: 4, marginBottom: spacing.md, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.rust, borderRadius: 4 },
  progressText: { position: 'absolute', right: 4, top: -4, fontSize: 10, color: colors.textMuted },
});
