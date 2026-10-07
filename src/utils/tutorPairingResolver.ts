/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ManagedStudent } from '../types';
import { FirestoreTutorAssignmentDoc } from '../firebase';

export interface AssignedStudentSummary {
  studentId: string;
  studentName: string;
  level?: string;
  grade?: string;
  district?: string;
  address?: string;
  parentName?: string;
  whatsapp?: string;
  schedule?: string[];
  subjects?: string[];
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
        studentName: s.studentName,
        level: s.level,
        grade: s.grade,
        district: s.district,
        address: s.address,
        parentName: s.parentName,
        whatsapp: s.whatsapp,
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
        studentName: a.studentName || existing?.studentName || 'Siswa',
        level: a.level || existing?.level,
        grade: a.grade || existing?.grade,
        district: a.district || existing?.district,
        address: a.address || existing?.address,
        parentName: a.parentName || existing?.parentName,
        whatsapp: a.whatsapp || existing?.whatsapp,
        schedule: a.schedule || existing?.schedule,
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
