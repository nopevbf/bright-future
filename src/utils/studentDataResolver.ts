import { ManagedStudent } from '../components/admin/studentData';
import { FirestoreTutorVisitDoc } from '../firebase';
import { LearningMaterial } from './learningMaterials';

export interface StudentMetrics {
  xpPoints: number;
  streakDays: number;
  completedSessions: number;
  packageSessions: number;
  attendancePercentage: number;
  avgScore: number;
}

export interface StudentCustomProfile {
  avatarUrl?: string;
  dream?: string;
  hobby?: string;
  updatedAt?: string;
}

const QUIZ_PASS_STORAGE_KEY_PREFIX = 'bf_student_quizzes_';
const PROFILE_STORAGE_KEY_PREFIX = 'bf_student_custom_profile_';

function safeLower(str?: string | null): string {
  return (str || '').trim().toLowerCase();
}

/**
 * Resolves a student's profile from the list of managed students in Firestore / local cache.
 * Falls back to basic template if student is not yet recorded.
 */
export function resolveStudentProfile(
  studentId: string,
  studentName?: string,
  managedStudents: ManagedStudent[] = []
): ManagedStudent {
  const normalizedId = safeLower(studentId);
  const normalizedName = safeLower(studentName);

  const found = Array.isArray(managedStudents)
    ? managedStudents.find((s) => {
        if (!s) return false;
        const idMatch = normalizedId && s.id && safeLower(s.id) === normalizedId;
        const nameMatch = normalizedName && s.studentName && safeLower(s.studentName) === normalizedName;
        return Boolean(idMatch || nameMatch);
      })
    : undefined;

  if (found) {
    return found;
  }

  // Graceful fallback
  return {
    id: studentId || 'BF-2026-NEW',
    studentName: studentName || 'Siswa Bright Future',
    level: 'SD UMUM',
    grade: 'Kelas 4 SD',
    schoolOrigin: 'Sekolah di Magelang',
    parentName: 'Wali Murid',
    parentRelation: 'Wali',
    whatsapp: '081200000000',
    address: 'Magelang, Jawa Tengah',
    district: 'Magelang',
    tutorName: '',
    subjects: ['Tematik SD', 'Matematika'],
    packageSessions: 8,
    completedSessions: 0,
    status: 'aktif',
    joinDate: new Date().toISOString().split('T')[0],
  };
}

/**
 * Calculates deterministic XP and learning metrics:
 * XP = (completedSessions * 100) + (avgScore * 5) + (passedQuizzesCount * 50)
 */
export function calculateStudentMetrics(
  student?: ManagedStudent,
  visits: FirestoreTutorVisitDoc[] = [],
  passedQuizzesCount = 0
): StudentMetrics {
  const packageSessions = Math.max(1, student?.packageSessions || 8);
  const completedSessions = student?.completedSessions ?? 0;
  const targetName = safeLower(student?.studentName);

  // Calculate average evaluation score
  const studentVisits = Array.isArray(visits)
    ? visits.filter(
        (v) =>
          Boolean(v) &&
          targetName &&
          safeLower(v.studentName) === targetName &&
          v.status === 'selesai' &&
          typeof v.score === 'number' &&
          v.score > 0
      )
    : [];

  let totalScoreSum = 0;
  let totalScoreCount = 0;

  studentVisits.forEach((v) => {
    totalScoreSum += v.score!;
    totalScoreCount++;
  });

  if (student?.lastEvaluationScore && student.lastEvaluationScore > 0) {
    totalScoreSum += student.lastEvaluationScore;
    totalScoreCount++;
  }

  const avgScore = totalScoreCount > 0 ? Math.round(totalScoreSum / totalScoreCount) : 85;

  const xpPoints = completedSessions * 100 + avgScore * 5 + passedQuizzesCount * 50;

  const attendancePercentage = Math.min(
    100,
    Math.round((completedSessions / packageSessions) * 100)
  );

  // Deterministic streak: based on completed sessions + quiz activity (minimum 1 day for active student)
  const streakDays = Math.max(1, Math.min(30, completedSessions + passedQuizzesCount + 2));

  return {
    xpPoints,
    streakDays,
    completedSessions,
    packageSessions,
    attendancePercentage,
    avgScore,
  };
}

/**
 * Filters learning materials strictly matching student level and grade.
 */
export function filterLearningMaterialsForStudent(
  student?: ManagedStudent,
  materials: LearningMaterial[] = []
): LearningMaterial[] {
  const studentLevelNorm = safeLower(student?.level);
  const studentGradeNorm = safeLower(student?.grade);

  if (!Array.isArray(materials)) return [];

  return materials.filter((m) => {
    if (!m || m.status !== 'disetujui') return false;

    const matLevelNorm = safeLower(m.level);
    const matCatNorm = safeLower(m.category);

    // Check level / grade matching
    const levelMatch =
      (matLevelNorm && studentLevelNorm && (matLevelNorm.includes(studentLevelNorm) || studentLevelNorm.includes(matLevelNorm))) ||
      (studentLevelNorm.includes('sd') && (matCatNorm === 'sd' || matLevelNorm.includes('sd'))) ||
      (studentLevelNorm.includes('smp') && (matCatNorm === 'smp' || matLevelNorm.includes('smp'))) ||
      (studentLevelNorm.includes('sma') && (matCatNorm === 'sma' || matLevelNorm.includes('sma')));

    const gradeMatch = studentGradeNorm && matLevelNorm ? matLevelNorm.includes(studentGradeNorm) : true;

    return Boolean(levelMatch || gradeMatch);
  });
}

/**
 * Gets passed quiz IDs for a student from local storage.
 */
export function getStudentQuizPasses(studentId: string): string[] {
  try {
    const raw = localStorage.getItem(`${QUIZ_PASS_STORAGE_KEY_PREFIX}${studentId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Records a quiz pass for a student if score >= 70, avoiding duplicate spam.
 * Returns true if new pass recorded, false if already passed or failed.
 */
export function recordStudentQuizPass(studentId: string, quizId: string, score: number): boolean {
  if (score < 70) {
    return false;
  }

  const existing = getStudentQuizPasses(studentId);
  if (existing.includes(quizId)) {
    return false; // Already passed and rewarded
  }

  const updated = [...existing, quizId];
  try {
    localStorage.setItem(
      `${QUIZ_PASS_STORAGE_KEY_PREFIX}${studentId}`,
      JSON.stringify(updated)
    );
    return true;
  } catch (err) {
    console.error('Failed to save quiz pass:', err);
    return false;
  }
}

/**
 * Retrieves student's custom profile preferences (avatar, dream, hobby).
 */
export function getStudentCustomProfile(studentId: string): StudentCustomProfile {
  try {
    const raw = localStorage.getItem(`${PROFILE_STORAGE_KEY_PREFIX}${studentId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Saves student's custom profile preferences.
 */
export function saveStudentCustomProfile(
  studentId: string,
  profile: Partial<StudentCustomProfile>
): void {
  const current = getStudentCustomProfile(studentId);
  const updated: StudentCustomProfile = {
    ...current,
    ...profile,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(
      `${PROFILE_STORAGE_KEY_PREFIX}${studentId}`,
      JSON.stringify(updated)
    );
  } catch (err) {
    console.error('Failed to save custom profile:', err);
  }
}
