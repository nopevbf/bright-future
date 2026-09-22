/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EducationalLevel, SubmittedRegistration } from './types';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ProgramSection } from './components/ProgramSection';
import { TentangSection } from './components/TentangSection';
import { TutorSection } from './components/TutorSection';
import { GaleriSection } from './components/GaleriSection';
import { CaraBelajarSection } from './components/CaraBelajarSection';
import { CostCalculator } from './components/CostCalculator';
import { TestimoniSection } from './components/TestimoniSection';
import { FaqSection } from './components/FaqSection';
import { RegistrationForm } from './components/RegistrationForm';
import { LoginModal } from './components/LoginModal';
import { MidtransDemoModal } from './components/MidtransDemoModal';
import { Footer } from './components/Footer';

export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState<boolean>(false);
  const [selectedLevel, setSelectedLevel] = useState<EducationalLevel | ''>('sd');
  const [tutorNotes, setTutorNotes] = useState<string>('');
  const [activeMidtransSubmission, setActiveMidtransSubmission] =
    useState<SubmittedRegistration | null>(null);

  const scrollToRegistration = () => {
    const el = document.getElementById('form-daftar');
    if (el) {
      const yOffset = -110;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  };

  const scrollToCaraBelajar = () => {
    const el = document.getElementById('cara-belajar');
    if (el) {
      const yOffset = -110;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  };

  const handleSelectProgram = (level: EducationalLevel) => {
    setSelectedLevel(level);
    scrollToRegistration();
  };

  const handleRequestTutor = (tutorName: string) => {
    setTutorNotes(`Request sesi bimbingan bersama ${tutorName}`);
    scrollToRegistration();
  };

  const handleApplyCalculatedPlan = (
    level: EducationalLevel,
    _sessions: number,
    _discount: boolean
  ) => {
    setSelectedLevel(level);
    scrollToRegistration();
  };

  return (
    <div className="min-h-screen bg-[#FAF7F1] text-[#2A2823] flex flex-col selection:bg-[#6F8F76]/25 selection:text-[#3F5A46]">
      {/* Fixed Navigation Bar */}
      <Navbar
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenCalculator={() => setIsCalculatorModalOpen(true)}
        onSelectRegister={scrollToRegistration}
      />

      {/* Main Landing Sections */}
      <main className="flex-1 pt-20 sm:pt-24">
        {/* 1. Hero Section */}
        <HeroSection
          onSelectRegister={scrollToRegistration}
          onExploreWorkflow={scrollToCaraBelajar}
        />

        {/* 2. Program Belajar (4 Jenjang) */}
        <ProgramSection onSelectProgram={handleSelectProgram} />

        {/* 3. Tentang Kami & Bento Metrics */}
        <TentangSection />

        {/* 4. Profil Tutor Publik */}
        <TutorSection onRequestTutor={handleRequestTutor} />

        {/* 5. Galeri Aktivitas & Modul Belajar */}
        <GaleriSection />

        {/* 6. 4 Langkah Cara Belajar House-to-House */}
        <CaraBelajarSection />

        {/* 7. Interactive Cost Calculator Section */}
        <CostCalculator onApplyPlan={handleApplyCalculatedPlan} />

        {/* 8. Testimoni Orang Tua */}
        <TestimoniSection />

        {/* 9. FAQ Interaktif */}
        <FaqSection />

        {/* 10. Form Pendaftaran Siswa Baru */}
        <RegistrationForm
          initialLevel={selectedLevel}
          initialNotes={tutorNotes}
          onOpenMidtransDemo={(sub) => setActiveMidtransSubmission(sub)}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Multi-role Login Portal Modal */}
      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}

      {/* Calculator Modal Triggered from Header */}
      {isCalculatorModalOpen && (
        <CostCalculator
          isModal
          onClose={() => setIsCalculatorModalOpen(false)}
          onApplyPlan={(lvl, sess, disc) => {
            setIsCalculatorModalOpen(false);
            handleApplyCalculatedPlan(lvl, sess, disc);
          }}
        />
      )}

      {/* Midtrans Snap Simulation Modal */}
      {activeMidtransSubmission && (
        <MidtransDemoModal
          submission={activeMidtransSubmission}
          onClose={() => setActiveMidtransSubmission(null)}
        />
      )}
    </div>
  );
}
