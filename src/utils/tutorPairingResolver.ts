/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ManagedStudent } from '../types';
import { FirestoreTutorAssignmentDoc, FirestoreTutorVisitDoc } from '../firebase';
export type { FirestoreTutorVisitDoc };

export interface AssignedStudentSummary {
  studentId: string;
  id?: string;
  studentName: string;
  level?: string;
  grade?: string;
  district?: string;
  address?: string;
  parentName?: string;
  whatsapp?: string;
  parentPhone?: string;
  schedule?: string[];
  scheduleDays?: string[];
  subjects?: string[];
  subject?: string;
  tutorName?: string;
  status?: string;
}

export interface AssignedTutorSummary {
  tutorName: string;
  tutorPhone?: string;
  subjects?: string[];
  district?: string;
  assignedAt?: string;
}

/**
 * Normalizes strings for robust matching (trim & lower-case).
 */
function norm(str?: string): string {
  return (str || '').trim().toLowerCase();
}

/**
 * Resolves list of students assigned to a specific tutor across managed students
 * and explicit tutor assignment documents.
 */
export function resolveStudentsForTutor(
  tutorName: string,
  managedStudents: ManagedStudent[] = [],
  assignments: FirestoreTutorAssignmentDoc[] = []
): AssignedStudentSummary[] {
  const targetTutor = norm(tutorName);
  if (!targetTutor) return [];

  const studentMap = new Map<string, AssignedStudentSummary>();

  // 1. Check managedStudents
  for (const s of managedStudents) {
    if (norm(s.tutorName) === targetTutor) {
      studentMap.set(s.id, {
        studentId: s.id,
        id: s.id,
        studentName: s.studentName,
        level: s.level,
        grade: s.grade,
        district: s.district,
        address: s.address,
        parentName: s.parentName,
        whatsapp: s.whatsapp,
        parentPhone: s.whatsapp,
        subjects: s.subjects,
        status: s.status,
      });
    }
  }

  // 2. Check explicit assignments (higher fidelity / updates)
  for (const a of assignments) {
    if (norm(a.tutorName) === targetTutor) {
      const existing = studentMap.get(a.studentId);
      studentMap.set(a.studentId, {
        studentId: a.studentId,
        id: a.studentId,
        studentName: a.studentName || existing?.studentName || 'Siswa',
        level: a.level || existing?.level,
        grade: a.grade || existing?.grade,
        district: a.district || existing?.district,
        address: a.address || existing?.address,
        parentName: a.parentName || existing?.parentName,
        whatsapp: a.whatsapp || existing?.whatsapp,
        parentPhone: a.whatsapp || existing?.whatsapp,
        schedule: a.schedule || existing?.schedule,
        scheduleDays: a.schedule || existing?.schedule,
        subjects: a.subjects || existing?.subjects,
        status: a.status || existing?.status,
      });
    }
  }

  return Array.from(studentMap.values());
}

/**
 * Resolves tutor assignment for a given student identifier (id or studentName).
 */
export function resolveTutorForStudent(
  studentIdentifier: string,
  managedStudents: ManagedStudent[] = [],
  assignments: FirestoreTutorAssignmentDoc[] = []
): AssignedTutorSummary | null {
  const target = norm(studentIdentifier);
  if (!target) return null;

  // 1. Look in explicit assignments first (recent dispatch)
  const assignDoc = assignments.find(
    (a) =>
      norm(a.studentId) === target ||
      norm(a.studentName) === target ||
      norm(a.studentName).includes(target) ||
      target.includes(norm(a.studentName))
  );

  if (assignDoc && assignDoc.tutorName && assignDoc.tutorName.trim() !== '') {
    return {
      tutorName: assignDoc.tutorName,
      tutorPhone: assignDoc.tutorPhone,
      subjects: assignDoc.subjects,
      district: assignDoc.district,
      assignedAt: assignDoc.assignedAt,
    };
  }

  // 2. Look in managedStudents
  const managed = managedStudents.find(
    (s) =>
      norm(s.id) === target ||
      norm(s.studentName) === target ||
      norm(s.studentName).includes(target) ||
      target.includes(norm(s.studentName))
  );

  if (managed && managed.tutorName && managed.tutorName.trim() !== '') {
    return {
      tutorName: managed.tutorName,
      subjects: managed.subjects,
      district: managed.district,
    };
  }

  return null;
}

/**
 * Computes human-friendly load badge label.
 */
export function calculateTutorLoadLabel(assignedCount: number): string {
  if (assignedCount === 0) {
    return 'Siap Penugasan Baru';
  }
  return `${assignedCount} Siswa Aktif`;
}

const DEFAULT_SCHEDULE_TIMES = [
  '13:30 - 14:40 WIB',
  '15:00 - 16:10 WIB',
  '16:30 - 17:40 WIB',
  '18:30 - 19:40 WIB',
];

/**
 * Builds dynamic tutor visits list purely from assigned students from database.
 * No hardcoded dummy visits inserted.
 */
export function buildTutorVisitsFromAssignedStudents(
  assignedStudents: AssignedStudentSummary[] = [],
  existingVisits: FirestoreTutorVisitDoc[] = []
): FirestoreTutorVisitDoc[] {
  if (!assignedStudents || assignedStudents.length === 0) {
    return [];
  }

  return assignedStudents.map((stu, idx) => {
    // Check if there is an existing persisted visit evaluation doc in Firestore
    const existing = existingVisits.find(
      (v) =>
        norm(v.studentName) === norm(stu.studentName) ||
        v.id === `visit-${stu.studentId}` ||
        v.id === stu.studentId
    );

    // Resolve timing from student schedule if specified
    let scheduleTime = '';
    if (stu.schedule && stu.schedule.length > 0) {
      const match = stu.schedule[0].match(/(\d{1,2}[:.]\d{2})/);
      if (match) {
        scheduleTime = `${match[1].replace('.', ':')} WIB`;
      } else {
        scheduleTime = stu.schedule[0];
      }
    }
    if (!scheduleTime) {
      scheduleTime = DEFAULT_SCHEDULE_TIMES[idx % DEFAULT_SCHEDULE_TIMES.length];
    }

    const defaultSubject =
      stu.subjects && stu.subjects.length > 0
        ? stu.subjects[0]
        : `Bimbingan Belajar ${stu.level || 'SD'}`;

    return {
      id: existing?.id || `visit-${stu.studentId || idx + 1}`,
      studentName: stu.studentName,
      level: existing?.level || stu.grade || stu.level || 'SD',
      time: existing?.time || scheduleTime,
      status: existing?.status || (idx === 0 ? 'berlangsung' : 'berikutnya'),
      address:
        existing?.address ||
        stu.address ||
        `${stu.district ? `${stu.district}, ` : ''}Kabupaten Magelang`,
      subject: existing?.subject || defaultSubject,
      score: existing?.score,
      focusRating: existing?.focusRating,
      independenceRating: existing?.independenceRating,
      notes: existing?.notes || `Kunjungan belajar rumah bersama ${stu.studentName}.`,
      parentName: existing?.parentName || stu.parentName || 'Wali Murid',
      parentWa: existing?.parentWa || stu.whatsapp || '085173230198',
      durationMinutes: existing?.durationMinutes || 70,
      elapsedMinutes: existing?.elapsedMinutes,
      updatedAt: existing?.updatedAt,
    };
  });
}
