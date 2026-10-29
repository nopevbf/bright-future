import React, { useState } from 'react';
import { ManagedStudent } from '../admin/studentData';
import { LearningMaterial, GOOGLE_DRIVE_SHARED_FOLDER_URL } from '../../utils/learningMaterials';
import { filterLearningMaterialsForStudent } from '../../utils/studentDataResolver';

interface StudentMaterialsTabProps {
  student: ManagedStudent;
  materials: LearningMaterial[];
  onOpenQuizForMaterial?: (materialTitle: string) => void;
  passedQuizIds: string[];
}

export const StudentMaterialsTab: React.FC<StudentMaterialsTabProps> = ({
  student,
  materials,
  onOpenQuizForMaterial,
  passedQuizIds,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('semua');

  const filteredMaterials = filterLearningMaterialsForStudent(student, materials);

  const displayed = selectedSubject === 'semua'
    ? filteredMaterials
    : filteredMaterials.filter((m) => m.subject.toLowerCase() === selectedSubject.toLowerCase());

  // Collect unique subjects
  const availableSubjects = Array.from(
    new Set(filteredMaterials.map((m) => m.subject).filter(Boolean))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(42,40,35,0.08)]">
        <div>
          <h2 className="text-xl font-bold text-[#284230]">Materi &amp; LKPD Belajar</h2>
          <p className="text-xs text-[#6B675F] mt-0.5">
            Lembar Kerja Peserta Didik (LKPD) &amp; modul resmi untuk jenjang {student.grade || student.level}.
          </p>
        </div>

        <a
          href={GOOGLE_DRIVE_SHARED_FOLDER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-[#284230] border border-[rgba(42,40,35,0.12)] hover:bg-[#FAF7F1] text-xs font-bold transition-all"
        >
          <span className="material-symbols-outlined text-[17px] text-[#C1683F]">folder_shared</span>
          <span>Google Drive Materi</span>
        </a>
      </div>

      {/* Subject Filter */}
      {availableSubjects.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedSubject('semua')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedSubject === 'semua'
                ? 'bg-[#3F5A46] text-white shadow-xs'
                : 'bg-white text-[#6B675F] border border-[rgba(42,40,35,0.08)] hover:bg-[#FAF7F1]'
            }`}
          >
            Semua Mapel ({filteredMaterials.length})
          </button>
          {availableSubjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedSubject === sub
                  ? 'bg-[#3F5A46] text-white shadow-xs'
                  : 'bg-white text-[#6B675F] border border-[rgba(42,40,35,0.08)] hover:bg-[#FAF7F1]'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Materials Grid */}
      {displayed.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayed.map((mat) => {
            const isQuizDone = passedQuizIds.includes(`quiz-${mat.id}`);

            return (
              <div
                key={mat.id}
                className="p-5 rounded-3xl bg-white border border-[rgba(42,40,35,0.08)] shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#c8ebce]/60 text-[#284230] text-[10px] font-bold uppercase">
                      {mat.subject}
                    </span>
                    <span className="text-[10px] text-[#6B675F] font-semibold">
                      {mat.level}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#1c1c18] line-clamp-2">{mat.title}</h3>
                  <p className="text-xs text-[#6B675F] mt-1.5 line-clamp-2 leading-relaxed">
                    {mat.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[rgba(42,40,35,0.08)] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <a
                      href={mat.driveUrl || mat.fileUrl || GOOGLE_DRIVE_SHARED_FOLDER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3F5A46] hover:text-[#284230]"
                    >
                      <span className="material-symbols-outlined text-[16px]">file_open</span>
                      <span>Buka Modul / LKPD</span>
                    </a>

                    {onOpenQuizForMaterial && (
                      <button
                        type="button"
                        onClick={() => onOpenQuizForMaterial(mat.title)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
                          isQuizDone
                            ? 'bg-[#c8ebce] text-[#284230]'
                            : 'bg-[#C1683F] text-white hover:bg-[#a95730]'
                        }`}
                      >
                        {isQuizDone ? 'Tuntas (+50 XP)' : 'Kuis Bab'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-[#FAF7F1] text-center border border-dashed border-[rgba(42,40,35,0.12)]">
          <div className="w-12 h-12 rounded-2xl bg-white text-[#284230] mx-auto flex items-center justify-center mb-3 shadow-xs">
            <span className="material-symbols-outlined text-[24px]">menu_book</span>
          </div>
          <h4 className="text-sm font-bold text-[#1c1c18]">Belum Ada Modul untuk Jenjang Ini</h4>
          <p className="text-xs text-[#6B675F] max-w-md mx-auto mt-1">
            Kakak Tutor dan Tim Akademik sedang menyusun lembar kerja yang disesuaikan dengan kurikulum kelasmu.
          </p>
        </div>
      )}
    </div>
  );
};
