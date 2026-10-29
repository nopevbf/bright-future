import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';

export type MaterialType = 'modul' | 'lembar_kerja';
export type MaterialStatus = 'under_review' | 'published' | 'rejected';

export const GOOGLE_DRIVE_SHARED_FOLDER_URL =
  'https://drive.google.com/drive/folders/1_BrightFuture_Shared_Materials_Magelang?usp=sharing';

export interface LearningMaterial {
  id: string;
  type: MaterialType;
  title: string;
  level: string;
  subject: string;
  category?: 'sd' | 'smp' | 'eksperimen' | 'flashcard';
  description: string;
  curriculum?: string;
  uploadedBy: string;
  uploaderRole: 'tutor' | 'admin';
  status: MaterialStatus;
  rejectionReason?: string;
  fileUrl?: string;
  driveUrl?: string;
  fileName?: string;
  fileSize?: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

const STORAGE_KEY = 'bf_learning_materials_v1';

export const INITIAL_LEARNING_MATERIALS: LearningMaterial[] = [
  {
    id: 'mat-01',
    type: 'lembar_kerja',
    title: 'LKPD Sains Bab 4: Gerak Rotasi & Revolusi Bumi',
    level: 'SD Kelas 5',
    subject: 'IPAS',
    category: 'sd',
    description: 'Panduan observasi bayangan matahari & lembar pengerjaan 5 butir pemahaman zona waktu WIB/WITA/WIT.',
    curriculum: 'Kurikulum Merdeka',
    uploadedBy: 'Kak Anindya, S.Pd.',
    uploaderRole: 'tutor',
    status: 'published',
    fileName: 'LKPD_Rotasi_Bumi_SD5.pdf',
    fileSize: '2.4 MB',
    driveUrl: 'https://drive.google.com/drive/folders/1_BrightFuture_Shared_Materials_Magelang?usp=sharing',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    reviewedBy: 'Super Admin',
    reviewedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'mat-02',
    type: 'lembar_kerja',
    title: 'Flashcard Fonik & Lembar Motorik Cerita Rakyat',
    level: 'SD Kelas 2 & TK-B',
    subject: 'Bahasa Indonesia',
    category: 'flashcard',
    description: 'Set 24 kartu raba huruf vokal & konsonan rangkap dipadukan aktivitas menebalkan jalur ilustrasi Si Kancil.',
    curriculum: 'Literasi Dasar',
    uploadedBy: 'Kak Anindya, S.Pd.',
    uploaderRole: 'tutor',
    status: 'published',
    fileName: 'Flashcard_Fonik_Cerita_Rakyat.pdf',
    fileSize: '1.8 MB',
    createdAt: '2026-09-02T09:00:00Z',
    updatedAt: '2026-09-02T11:00:00Z',
    reviewedBy: 'Super Admin',
    reviewedAt: '2026-09-02T11:00:00Z',
  },
  {
    id: 'mat-03',
    type: 'modul',
    title: 'Modul Persamaan Linier Satu Variabel & Masalah Kontekstual',
    level: 'SMP Kelas 7',
    subject: 'Matematika',
    category: 'smp',
    description: '8 Halaman materi konsep neraca timbangan, 10 soal drill bertingkat (mudah, sedang, HOTS cerita pedagang Pasar Rejowinangun).',
    curriculum: 'Matematika Aljabar',
    uploadedBy: 'Kak Budi, S.Pd.',
    uploaderRole: 'tutor',
    status: 'published',
    fileName: 'Modul_PLSV_SMP7.pdf',
    fileSize: '3.1 MB',
    createdAt: '2026-09-03T10:00:00Z',
    updatedAt: '2026-09-03T12:00:00Z',
    reviewedBy: 'Super Admin',
    reviewedAt: '2026-09-03T12:00:00Z',
  },
  {
    id: 'mat-04',
    type: 'modul',
    title: 'Modul Universal Eksperimen Siklus Air & Ekosistem Magelang',
    level: 'SD Kelas 4',
    subject: 'IPAS',
    category: 'eksperimen',
    description: 'Panduan eksperimen kondensasi toples kaca, observasi sumber mata air Kali Progo.',
    curriculum: 'Kurikulum Merdeka',
    uploadedBy: 'Kak Budi, S.Pd.',
    uploaderRole: 'tutor',
    status: 'published',
    fileName: 'Modul_Siklus_Air_SD4.pdf',
    fileSize: '2.0 MB',
    createdAt: '2026-09-05T08:00:00Z',
    updatedAt: '2026-09-05T09:30:00Z',
    reviewedBy: 'Super Admin',
    reviewedAt: '2026-09-05T09:30:00Z',
  },
  {
    id: 'mat-05',
    type: 'modul',
    title: 'Modul Pengantar Aljabar Dasar & Himpunan',
    level: 'SMP Kelas 7',
    subject: 'Matematika',
    category: 'smp',
    description: 'Pemahaman variabel x dan y melalui peragaan kelereng dan neraca seimbang.',
    curriculum: 'Kurikulum Merdeka',
    uploadedBy: 'Kak Anindya, S.Pd.',
    uploaderRole: 'tutor',
    status: 'under_review',
    fileName: 'Draf_Modul_Aljabar_Dasar.pdf',
    fileSize: '2.5 MB',
    createdAt: '2026-09-18T14:00:00Z',
    updatedAt: '2026-09-18T14:00:00Z',
  },
  {
    id: 'mat-06',
    type: 'lembar_kerja',
    title: 'LKPD Latihan Soal Pecahan Senilai & Desimal',
    level: 'SD Kelas 5',
    subject: 'Matematika',
    category: 'sd',
    description: '15 Butir soal bergambar kue bolu dan pizza untuk memahami pecahan senilai.',
    curriculum: 'Kurikulum Merdeka',
    uploadedBy: 'Kak Anindya, S.Pd.',
    uploaderRole: 'tutor',
    status: 'rejected',
    rejectionReason: 'Format nomor 7-10 terlalu padat dan belum ada kunci jawaban terpisah untuk wali murid.',
    fileName: 'LKPD_Pecahan_Senilai_Rev.pdf',
    fileSize: '1.2 MB',
    createdAt: '2026-09-16T11:00:00Z',
    updatedAt: '2026-09-17T09:00:00Z',
    reviewedBy: 'Super Admin',
    reviewedAt: '2026-09-17T09:00:00Z',
  },
];

export function getLocalLearningMaterials(): LearningMaterial[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading learning materials from localStorage:', err);
  }
  setLocalLearningMaterials(INITIAL_LEARNING_MATERIALS);
  return INITIAL_LEARNING_MATERIALS;
}

export function setLocalLearningMaterials(materials: LearningMaterial[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));
  } catch (err) {
    console.warn('Error saving learning materials to localStorage:', err);
  }
}

export function fetchLearningMaterials(): LearningMaterial[] {
  return getLocalLearningMaterials();
}

export async function saveLearningMaterial(
  payload: Omit<LearningMaterial, 'id' | 'status' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    status?: MaterialStatus;
  }
): Promise<LearningMaterial> {
  const current = getLocalLearningMaterials();
  const now = new Date().toISOString();
  const id = payload.id || `mat-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  const newItem: LearningMaterial = {
    ...payload,
    id,
    status: payload.status || 'under_review',
    createdAt: now,
    updatedAt: now,
  };

  const updated = [newItem, ...current.filter((m) => m.id !== id)];
  setLocalLearningMaterials(updated);

  // Sync to Firestore if available
  try {
    if (db) {
      const ref = doc(db, 'learning_materials', id);
      await setDoc(ref, newItem, { merge: true });
    }
  } catch (err) {
    console.warn('Firestore sync note (learning_materials):', err);
  }

  return newItem;
}

export async function approveLearningMaterial(
  id: string,
  reviewerName = 'Super Admin'
): Promise<LearningMaterial> {
  const current = getLocalLearningMaterials();
  const target = current.find((m) => m.id === id);
  if (!target) throw new Error(`Material with ID ${id} not found.`);

  const now = new Date().toISOString();
  const updatedItem: LearningMaterial = {
    ...target,
    status: 'published',
    rejectionReason: undefined,
    reviewedBy: reviewerName,
    reviewedAt: now,
    updatedAt: now,
  };

  const nextList = current.map((m) => (m.id === id ? updatedItem : m));
  setLocalLearningMaterials(nextList);

  try {
    if (db) {
      const ref = doc(db, 'learning_materials', id);
      await updateDoc(ref, {
        status: 'published',
        rejectionReason: null,
        reviewedBy: reviewerName,
        reviewedAt: now,
        updatedAt: now,
      });
    }
  } catch (err) {
    console.warn('Firestore update note (approve material):', err);
  }

  return updatedItem;
}

export async function rejectLearningMaterial(
  id: string,
  reason: string,
  reviewerName = 'Super Admin'
): Promise<LearningMaterial> {
  const current = getLocalLearningMaterials();
  const target = current.find((m) => m.id === id);
  if (!target) throw new Error(`Material with ID ${id} not found.`);

  const now = new Date().toISOString();
  const updatedItem: LearningMaterial = {
    ...target,
    status: 'rejected',
    rejectionReason: reason,
    reviewedBy: reviewerName,
    reviewedAt: now,
    updatedAt: now,
  };

  const nextList = current.map((m) => (m.id === id ? updatedItem : m));
  setLocalLearningMaterials(nextList);

  try {
    if (db) {
      const ref = doc(db, 'learning_materials', id);
      await updateDoc(ref, {
        status: 'rejected',
        rejectionReason: reason,
        reviewedBy: reviewerName,
        reviewedAt: now,
        updatedAt: now,
      });
    }
  } catch (err) {
    console.warn('Firestore update note (reject material):', err);
  }

  return updatedItem;
}

export async function resubmitLearningMaterial(
  id: string,
  updates: Partial<LearningMaterial>
): Promise<LearningMaterial> {
  const current = getLocalLearningMaterials();
  const target = current.find((m) => m.id === id);
  if (!target) throw new Error(`Material with ID ${id} not found.`);

  const now = new Date().toISOString();
  const updatedItem: LearningMaterial = {
    ...target,
    ...updates,
    status: 'under_review',
    rejectionReason: undefined,
    updatedAt: now,
  };

  const nextList = current.map((m) => (m.id === id ? updatedItem : m));
  setLocalLearningMaterials(nextList);

  try {
    if (db) {
      const ref = doc(db, 'learning_materials', id);
      await updateDoc(ref, {
        ...updates,
        status: 'under_review',
        rejectionReason: null,
        updatedAt: now,
      });
    }
  } catch (err) {
    console.warn('Firestore update note (resubmit material):', err);
  }

  return updatedItem;
}

export function filterPublishedMaterials(materials: LearningMaterial[]): LearningMaterial[] {
  return materials.filter((m) => m.status === 'published');
}

export function filterTutorMaterials(
  materials: LearningMaterial[],
  tutorName: string
): LearningMaterial[] {
  const clean = tutorName.toLowerCase();
  return materials.filter(
    (m) =>
      m.status === 'published' ||
      (m.uploadedBy && m.uploadedBy.toLowerCase().includes(clean))
  );
}

export function subscribeToLearningMaterials(
  onUpdate: (materials: LearningMaterial[]) => void,
  onError?: (error: unknown) => void
): () => void {
  if (!db) {
    onUpdate(getLocalLearningMaterials());
    return () => {};
  }

  try {
    const colRef = collection(db, 'learning_materials');
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: LearningMaterial[] = [];
          snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as LearningMaterial));
          setLocalLearningMaterials(list);
          onUpdate(list);
        } else {
          onUpdate(getLocalLearningMaterials());
        }
      },
      (err) => {
        if (onError) onError(err);
        onUpdate(getLocalLearningMaterials());
      }
    );
  } catch (err) {
    if (onError) onError(err);
    onUpdate(getLocalLearningMaterials());
    return () => {};
  }
}
