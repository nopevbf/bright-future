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
import { TutorRegistrationModal } from './components/TutorRegistrationModal';
import { AdminDashboard } from './components/AdminDashboard';
import { TutorDashboard } from './components/TutorDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { ParentDashboard } from './components/ParentDashboard';
import { MaintenanceModal } from './components/MaintenanceModal';
import {
  isMaintenanceActive,
  getMaintenanceTargetTimestamp,
  disableMaintenanceMode,
} from './utils/maintenanceManager';
import {
  subscribeToMaintenanceStatus,
  saveMaintenanceStatusToFirestore,
} from './firebase';
import { AuthTransitionOverlay } from './components/AuthTransitionOverlay';
import {
  AuthRole,
  getActiveSession,
  getCurrentSession,
  saveAuthSession,
  clearActiveSession,
} from './utils/sessionToken';

export default function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return !!getActiveSession('admin');
  });
  const [isTutorLoggedIn, setIsTutorLoggedIn] = useState<boolean>(() => {
    return !!getActiveSession('tutor');
  });
  const [isSiswaLoggedIn, setIsSiswaLoggedIn] = useState<boolean>(() => {
    return !!getActiveSession('siswa');
  });
  const [isOrangTuaLoggedIn, setIsOrangTuaLoggedIn] = useState<boolean>(() => {
    return !!getActiveSession('orang_tua');
  });
  const [transitionState, setTransitionState] = useState<{
    mode: 'login' | 'logout';
    role: AuthRole;
    userName: string;
    onComplete: () => void;
  } | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isTutorRegisterOpen, setIsTutorRegisterOpen] = useState<boolean>(false);
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState<boolean>(false);
  const [selectedLevel, setSelectedLevel] = useState<EducationalLevel | ''>('sd');
  const [selectedSessionsPerWeek, setSelectedSessionsPerWeek] = useState<number | undefined>(undefined);
  const [selectedSiblingDiscount, setSelectedSiblingDiscount] = useState<boolean | undefined>(undefined);
  const [tutorNotes, setTutorNotes] = useState<string>('');
  const [activeMidtransSubmission, setActiveMidtransSubmission] =
    useState<SubmittedRegistration | null>(null);

  // Authenticated user identity states for dynamic portals
  const [currentAdminName, setCurrentAdminName] = useState<string>(() => {
    return sessionStorage.getItem('bf_admin_name') || 'Super Admin';
  });
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string>(() => {
    return sessionStorage.getItem('bf_admin_email') || 'admin@brightfuture.id';
  });
  const [currentAdminRole, setCurrentAdminRole] = useState<string>(() => {
    return sessionStorage.getItem('bf_admin_role') || 'super_admin';
  });
  const [currentTutorName, setCurrentTutorName] = useState<string>(() => {
    return sessionStorage.getItem('bf_tutor_name') || 'Kak Anindya, S.Pd.';
  });
  const [currentTutorEmail, setCurrentTutorEmail] = useState<string>(() => {
    return sessionStorage.getItem('bf_tutor_email') || 'anindya.tutor@brightfuture.id';
  });
  const [currentStudentName, setCurrentStudentName] = useState<string>(() => {
    return sessionStorage.getItem('bf_siswa_name') || 'Rayhan Kusuma';
  });
  const [currentStudentId, setCurrentStudentId] = useState<string>(() => {
    return sessionStorage.getItem('bf_siswa_id') || 'BF-2026-09-8812';
  });
  const [currentParentName, setCurrentParentName] = useState<string>(() => {
    return sessionStorage.getItem('bf_orang_tua_name') || 'Bunda Ratna Dewi';
  });
  const [currentParentPhone, setCurrentParentPhone] = useState<string>(() => {
    return sessionStorage.getItem('bf_orang_tua_phone') || '0812-9876-5432';
  });

  // Maintenance mode barrier states
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(() => isMaintenanceActive());
  const [maintenanceTargetTime, setMaintenanceTargetTime] = useState<number>(() =>
    getMaintenanceTargetTimestamp()
  );

  useEffect(() => {
    const handleMaintenanceChange = () => {
      setIsMaintenanceMode(isMaintenanceActive());
      setMaintenanceTargetTime(getMaintenanceTargetTimestamp());
    };
    window.addEventListener('bf_maintenance_status_changed', handleMaintenanceChange);
    window.addEventListener('storage', handleMaintenanceChange);

    const unsubscribe = subscribeToMaintenanceStatus((data) => {
      setIsMaintenanceMode(Boolean(data.isActive));
      setMaintenanceTargetTime(data.targetTimestamp || 0);
    });

    return () => {
      window.removeEventListener('bf_maintenance_status_changed', handleMaintenanceChange);
      window.removeEventListener('storage', handleMaintenanceChange);
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Route security guard: prevent URL bypass without a cryptographically valid token
  useEffect(() => {
    const handleHashAndGuard = () => {
      const hash = window.location.hash;
      if (hash === '#admin') {
        const session = getActiveSession('admin');
        if (session) {
          setIsAdminLoggedIn(true);
          setIsTutorLoggedIn(false);
          setIsSiswaLoggedIn(false);
          setIsOrangTuaLoggedIn(false);
        } else {
          setIsAdminLoggedIn(false);
          window.location.hash = '';
        }
      } else if (hash === '#tutor') {
        const session = getActiveSession('tutor');
        if (session) {
          setIsTutorLoggedIn(true);
          setIsAdminLoggedIn(false);
          setIsSiswaLoggedIn(false);
          setIsOrangTuaLoggedIn(false);
        } else {
          setIsTutorLoggedIn(false);
          window.location.hash = '';
        }
      } else if (hash === '#siswa') {
        const session = getActiveSession('siswa');
        if (session) {
          setIsSiswaLoggedIn(true);
          setIsAdminLoggedIn(false);
          setIsTutorLoggedIn(false);
          setIsOrangTuaLoggedIn(false);
        } else {
          setIsSiswaLoggedIn(false);
          window.location.hash = '';
        }
      } else if (hash === '#orangtua' || hash === '#wali') {
        const session = getActiveSession('orang_tua');
        if (session) {
          setIsOrangTuaLoggedIn(true);
          setIsAdminLoggedIn(false);
          setIsTutorLoggedIn(false);
          setIsSiswaLoggedIn(false);
        } else {
          setIsOrangTuaLoggedIn(false);
          window.location.hash = '';
        }
      }
    };

    handleHashAndGuard();
    window.addEventListener('hashchange', handleHashAndGuard);
    return () => window.removeEventListener('hashchange', handleHashAndGuard);
  }, []);

  const handleTriggerLoginTransition = (
    role: AuthRole,
    user: { name?: string; identifier?: string; role?: string }
  ) => {
    setIsLoginOpen(false);
    const resolvedName = user.name || (role === 'admin' ? 'Super Admin' : 'Pengguna Portal');
    const resolvedIdentifier = user.identifier || '';

    setTransitionState({
      mode: 'login',
      role,
      userName: resolvedName,
      onComplete: () => {
        saveAuthSession(role, {
          name: resolvedName,
          identifier: resolvedIdentifier,
          role: user.role,
        });

        if (role === 'admin') {
          setCurrentAdminName(resolvedName);
          if (resolvedIdentifier) setCurrentAdminEmail(resolvedIdentifier);
          if (user.role) setCurrentAdminRole(user.role);
          setIsAdminLoggedIn(true);
          setIsTutorLoggedIn(false);
          setIsSiswaLoggedIn(false);
          setIsOrangTuaLoggedIn(false);
          window.location.hash = '#admin';
        } else if (role === 'tutor') {
          setCurrentTutorName(resolvedName);
          if (resolvedIdentifier) setCurrentTutorEmail(resolvedIdentifier);
          setIsTutorLoggedIn(true);
          setIsAdminLoggedIn(false);
          setIsSiswaLoggedIn(false);
          setIsOrangTuaLoggedIn(false);
          window.location.hash = '#tutor';
        } else if (role === 'siswa') {
          setCurrentStudentName(resolvedName);
          if (resolvedIdentifier) setCurrentStudentId(resolvedIdentifier);
          setIsSiswaLoggedIn(true);
          setIsAdminLoggedIn(false);
          setIsTutorLoggedIn(false);
          setIsOrangTuaLoggedIn(false);
          window.location.hash = '#siswa';
        } else if (role === 'orang_tua') {
          setCurrentParentName(resolvedName);
          if (resolvedIdentifier) setCurrentParentPhone(resolvedIdentifier);
          setIsOrangTuaLoggedIn(true);
          setIsAdminLoggedIn(false);
          setIsTutorLoggedIn(false);
          setIsSiswaLoggedIn(false);
          window.location.hash = '#orangtua';
        }
        setTransitionState(null);
      },
    });
  };

  const handleTriggerLogoutTransition = (role: AuthRole, userName: string) => {
    setTransitionState({
      mode: 'logout',
      role,
      userName,
      onComplete: () => {
        clearActiveSession();
        setIsAdminLoggedIn(false);
        setIsTutorLoggedIn(false);
        setIsSiswaLoggedIn(false);
        setIsOrangTuaLoggedIn(false);
        window.location.hash = '';
        setTransitionState(null);
      },
    });
  };

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
    sessions: number,
    discount: boolean
  ) => {
    setSelectedLevel(level);
    setSelectedSessionsPerWeek(sessions);
    setSelectedSiblingDiscount(discount);
    scrollToRegistration();
  };

  // Interactive Login/Logout Transition Screen with Animated Delay
  if (transitionState) {
    return (
      <AuthTransitionOverlay
        mode={transitionState.mode}
        role={transitionState.role}
        userName={transitionState.userName}
        durationMs={1100}
        onComplete={transitionState.onComplete}
      />
    );
  }

  // If Admin is logged in, show the Admin Operational Dashboard
  if (isAdminLoggedIn) {
    return (
      <AdminDashboard
        onLogout={() => handleTriggerLogoutTransition('admin', currentAdminName)}
        onViewLanding={() => {
          setIsAdminLoggedIn(false);
          window.location.hash = '';
        }}
        adminName={currentAdminName}
        adminEmail={currentAdminEmail}
        adminRole={currentAdminRole}
      />
    );
  }

  // If Tutor is logged in, show the Tutor Field Portal
  if (isTutorLoggedIn) {
    return (
      <TutorDashboard
        onLogout={() => handleTriggerLogoutTransition('tutor', currentTutorName)}
        onViewLanding={() => {
          setIsTutorLoggedIn(false);
          window.location.hash = '';
        }}
        tutorName={currentTutorName}
        tutorEmail={currentTutorEmail}
      />
    );
  }

  // If Siswa is logged in, show the Student Learning Portal
  if (isSiswaLoggedIn) {
    return (
      <StudentDashboard
        onLogout={() => handleTriggerLogoutTransition('siswa', currentStudentName)}
        onViewLanding={() => {
          setIsSiswaLoggedIn(false);
          window.location.hash = '';
        }}
        studentName={currentStudentName}
        studentId={currentStudentId}
      />
    );
  }

  // If Orang Tua is logged in, show the Parent Tracking Portal
  if (isOrangTuaLoggedIn) {
    return (
      <ParentDashboard
        onLogout={() => handleTriggerLogoutTransition('orang_tua', currentParentName)}
        onViewLanding={() => {
          setIsOrangTuaLoggedIn(false);
          window.location.hash = '';
        }}
        parentName={currentParentName}
        parentPhone={currentParentPhone}
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
        currentUser={
          (() => {
            const session = getCurrentSession();
            return session ? { name: session.name, role: session.role, identifier: session.identifier } : null;
          })()
        }
        onOpenDashboard={() => {
          const session = getCurrentSession();
          if (!session) return;
          if (session.role === 'admin') {
            setIsAdminLoggedIn(true);
            window.location.hash = '#admin';
          } else if (session.role === 'tutor') {
            setIsTutorLoggedIn(true);
            window.location.hash = '#tutor';
          } else if (session.role === 'siswa') {
            setIsSiswaLoggedIn(true);
            window.location.hash = '#siswa';
          } else if (session.role === 'orang_tua') {
            setIsOrangTuaLoggedIn(true);
            window.location.hash = '#orangtua';
          }
        }}
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
          initialSessionsPerWeek={selectedSessionsPerWeek}
          initialHasSiblingDiscount={selectedSiblingDiscount}
          onOpenMidtransDemo={(sub) => setActiveMidtransSubmission(sub)}
        />
      </main>

      {/* Footer */}
      <Footer
        onOpenAdminLogin={() => setIsLoginOpen(true)}
        onOpenTutorRegister={() => setIsTutorRegisterOpen(true)}
      />

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

      {/* Multi-role Login Portal Modal with Admin & Tutor Authentication */}
      {isLoginOpen && (
        <LoginModal
          onClose={() => setIsLoginOpen(false)}
          onAdminLoginSuccess={(user) => {
            handleTriggerLoginTransition('admin', user || { name: 'Super Admin', identifier: 'admin@brightfuture.id', role: 'super_admin' });
          }}
          onTutorLoginSuccess={(user) => {
            handleTriggerLoginTransition('tutor', user || { name: 'Kak Anindya, S.Pd.', identifier: 'anindya.tutor@brightfuture.id' });
          }}
          onSiswaLoginSuccess={(user) => {
            handleTriggerLoginTransition('siswa', user || { name: 'Rayhan Kusuma', identifier: 'BF-2026-09-8812' });
          }}
          onOrangTuaLoginSuccess={(user) => {
            handleTriggerLoginTransition('orang_tua', user || { name: 'Bunda Ratna Dewi', identifier: '0812-9876-5432' });
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

      {/* Tutor Registration Modal */}
      {isTutorRegisterOpen && (
        <TutorRegistrationModal onClose={() => setIsTutorRegisterOpen(false)} />
      )}

      {/* Maintenance Barrier Modal with 7-Day Countdown */}
      {isMaintenanceMode && (
        <MaintenanceModal
          isOpen={isMaintenanceMode}
          targetTimestamp={maintenanceTargetTime}
          onDeactivate={() => {
            disableMaintenanceMode();
            saveMaintenanceStatusToFirestore(false, 0).catch(console.warn);
            setIsMaintenanceMode(false);
          }}
        />
      )}
    </div>
  );
}
