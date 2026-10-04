import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TutorDispatchModal } from './TutorDispatchModal';
import { DispatchableStudent, DispatchableTutor } from '../../utils/tutorDispatch';
import { INITIAL_MANAGED_STUDENTS } from './studentData';
import { BASE_ACTIVE_TUTORS } from './TutorManagementSubTab';

describe('TutorDispatchModal Component (Crash Prevention & SQA-ISTQB)', () => {
  const dummyTutors: DispatchableTutor[] = BASE_ACTIVE_TUTORS.map((t) => ({
    name: t.name,
    district: t.district?.split('&')[0]?.trim() || 'Magelang',
    spec: t.spec,
    univ: t.univ,
    status: t.status,
    rating: t.rating,
  }));

  const sampleStudent: DispatchableStudent = {
    id: INITIAL_MANAGED_STUDENTS[0].id,
    studentName: INITIAL_MANAGED_STUDENTS[0].studentName,
    level: INITIAL_MANAGED_STUDENTS[0].level,
    grade: INITIAL_MANAGED_STUDENTS[0].grade,
    district: INITIAL_MANAGED_STUDENTS[0].district,
    address: INITIAL_MANAGED_STUDENTS[0].address,
    whatsapp: INITIAL_MANAGED_STUDENTS[0].whatsapp,
    parentName: INITIAL_MANAGED_STUDENTS[0].parentName,
    subjects: INITIAL_MANAGED_STUDENTS[0].subjects,
  };

  it('renders without crashing with complete student and tutors data', () => {
    const handleAssign = vi.fn();
    const handleClose = vi.fn();

    render(
      <TutorDispatchModal
        isOpen={true}
        onClose={handleClose}
        student={sampleStudent}
        tutors={dummyTutors}
        onAssignTutor={handleAssign}
      />
    );

    expect(screen.getByText('Pasangkan Tutor Terdekat & Terkompeten')).toBeInTheDocument();
    expect(screen.getByText(sampleStudent.studentName)).toBeInTheDocument();
  });

  it('renders gracefully without crashing when tutors list is empty', () => {
    const handleAssign = vi.fn();
    const handleClose = vi.fn();

    render(
      <TutorDispatchModal
        isOpen={true}
        onClose={handleClose}
        student={sampleStudent}
        tutors={[]}
        onAssignTutor={handleAssign}
      />
    );

    expect(screen.getByText('Pasangkan Tutor Terdekat & Terkompeten')).toBeInTheDocument();
  });

  it('renders gracefully without crashing when student has missing or undefined fields', () => {
    const handleAssign = vi.fn();
    const handleClose = vi.fn();

    const partialStudent: any = {
      id: 'TEST-PARTIAL',
      studentName: 'Siswa Uji Coba',
      level: undefined,
      grade: null,
      district: '',
      address: '',
      whatsapp: '08123456789',
      parentName: 'Wali Uji',
      subjects: undefined,
    };

    render(
      <TutorDispatchModal
        isOpen={true}
        onClose={handleClose}
        student={partialStudent}
        tutors={dummyTutors}
        onAssignTutor={handleAssign}
      />
    );

    expect(screen.getByText('Pasangkan Tutor Terdekat & Terkompeten')).toBeInTheDocument();
    expect(screen.getByText('Siswa Uji Coba')).toBeInTheDocument();
  });
});
