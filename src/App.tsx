/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return (
      sessionStorage.getItem('bf_admin_session') === 'true' ||
      window.location.hash === '#admin'
    );
  });
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState<boolean>(false);
  const [selectedLevel, setSelectedLevel] = useState<EducationalLevel | ''>('sd');
  const [tutorNotes, setTutorNotes] = useState<string>('');
  const [activeMidtransSubmission, setActiveMidtransSubmission] =
    useState<SubmittedRegistration | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setIsAdminLoggedIn(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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

  // If Admin is logged in, show the Admin Operational Dashboard
  if (isAdminLoggedIn) {
    return (
      <AdminDashboard
        onLogout={() => {
          sessionStorage.removeItem('bf_admin_session');
          setIsAdminLoggedIn(false);
          window.location.hash = '';
        }}
        onViewLanding={() => {
          setIsAdminLoggedIn(false);
          window.location.hash = '';
        }}
      />
    );
  }

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
      <Footer onOpenAdminLogin={() => setIsLoginOpen(true)} />

      {/* Floating WhatsApp Hotline Button */}
      <a
        href="https://wa.me/6285173230198?text=Halo%20Admin%20Bright%20Future%2C%20saya%20ingin%20konsultasi%20jadwal%20bimbel%20privat%20di%20Kabupaten%20Magelang"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hubungi WhatsApp Hotline +62 851-7323-0198"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all group"
      >
        <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
        <span className="hidden sm:inline font-bold text-xs">WhatsApp Hotline</span>
      </a>

      {/* Multi-role Login Portal Modal with Admin Authentication */}
      {isLoginOpen && (
        <LoginModal
          onClose={() => setIsLoginOpen(false)}
          onAdminLoginSuccess={() => {
            sessionStorage.setItem('bf_admin_session', 'true');
            setIsAdminLoggedIn(true);
            window.location.hash = '#admin';
          }}
        />
      )}

      {/* Calculator Modal Triggered from Header */}
      {isCalculatorModalOpen && (
        <CostCalculator
          isModal
          onClose={() => setIsCalculatorModalOpen(false)}
          onApplyPlan={handleApplyCalculatedPlan}
        />
      )}

      {/* Midtrans Snap Interactive Simulator Demo */}
      {activeMidtransSubmission && (
        <MidtransDemoModal
          submission={activeMidtransSubmission}
          onClose={() => setActiveMidtransSubmission(null)}
        />
      )}
    </div>
  );
}
