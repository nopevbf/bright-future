import React, { useState } from 'react';
import { PRIMARY_TUTOR } from '../data';
import { Star, ShieldCheck, ArrowRight, CheckCircle2, Award, Clock, Users } from 'lucide-react';

interface TutorSectionProps {
  onRequestTutor: (tutorName: string) => void;
}

export const TutorSection: React.FC<TutorSectionProps> = ({ onRequestTutor }) => {
  const [photoSrc, setPhotoSrc] = useState<string>(PRIMARY_TUTOR.photoUrl);

  const handleImageError = () => {
    if (photoSrc === '/tutor-monica.jpg') {
      // In case user placed it as 20240730_172259.jpg in public/
      setPhotoSrc('/20240730_172259.jpg');
    } else if (photoSrc === '/20240730_172259.jpg') {
      // Graceful fallback to verified educator portrait
      setPhotoSrc('https://lh3.googleusercontent.com/aida/AEtjO1XjakMp7m6Ui82cb_fdkm5Qfyr-Wh5uSlB114sDzTWP93cM6eSlzP-2_o0xKcYoYMf4d6uFlDyGyud1cr6jYTvjPPv9ZVStHmEmQt7KAEaq2-wKt6Jx28k7KTtVdOIi7Xi8Ycx5qj2bnuUmDXlUDGhReLseecRAtsJTPzSezvPcIpYTXOxDqVBKIa1Jt78EOBMGvU7Dm5pdBvdkypBdhQEZBWjHjmxvKvUEwm3G44Y4ZJKzAhy1aTKW');
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14" id="tutor">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-bold text-[#6F8F76] uppercase tracking-wider">
          Kualitas Pengajar Terpilih
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#2A2823] mt-1 font-display">
          Profil Tutor Publik Berdedikasi
        </h2>
        <p className="text-[#6B675F] text-sm sm:text-base mt-2">
          Setiap tutor melewati seleksi ketat verifikasi latar belakang akademik, uji mikro-teaching
          ramah anak, dan tes psikologi sebelum ditugaskan ke rumah Anda.
        </p>
      </div>

      <div className="max-w-4xl mx-auto liquid-glass rounded-[28px] p-6 sm:p-8 border border-white/80 shadow-glass">
        <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
          {/* Tutor Photo Container */}
          <div className="relative shrink-0">
            <img
              src={photoSrc}
              onError={handleImageError}
              alt={`${PRIMARY_TUTOR.name} - ${PRIMARY_TUTOR.role}`}
              className="w-40 h-40 sm:w-52 sm:h-52 rounded-[22px] object-cover shadow-md border-2 border-white"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-[#3F5A46] text-white text-xs font-bold flex items-center gap-1 shadow-sm">
              <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span>{PRIMARY_TUTOR.rating} / 5.0</span>
            </div>
          </div>

          {/* Tutor Credentials */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#EAF2ED] text-[#3F5A46] text-xs font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#6F8F76]" />
                <span>Tutor Berakreditasi Resmi</span>
              </div>
              <h3 className="text-2xl font-bold text-[#2A2823] font-display">
                {PRIMARY_TUTOR.name}
              </h3>
              <p className="text-sm font-medium text-[#C1683F]">{PRIMARY_TUTOR.role}</p>
              <p className="text-xs text-[#6B675F] mt-0.5">{PRIMARY_TUTOR.title}</p>
            </div>

            <blockquote className="text-xs sm:text-sm text-[#6B675F] leading-relaxed italic bg-white/50 p-3 rounded-xl border border-[rgba(42,40,35,0.06)]">
              "{PRIMARY_TUTOR.quote}"
            </blockquote>

            {/* 3 Metrics Badge Cards */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-left">
              <div className="p-2.5 rounded-[16px] bg-white/70 border border-[rgba(42,40,35,0.08)]">
                <div className="flex items-center gap-1 text-[10px] text-[#6B675F] font-semibold uppercase">
                  <Clock className="w-3 h-3 text-[#6F8F76]" />
                  <span>Jam Terbang</span>
                </div>
                <div className="text-sm font-bold text-[#2A2823] mt-0.5">
                  {PRIMARY_TUTOR.hoursFlight}
                </div>
              </div>

              <div className="p-2.5 rounded-[16px] bg-white/70 border border-[rgba(42,40,35,0.08)]">
                <div className="flex items-center gap-1 text-[10px] text-[#6B675F] font-semibold uppercase">
                  <Users className="w-3 h-3 text-[#C1683F]" />
                  <span>Siswa Terbina</span>
                </div>
                <div className="text-sm font-bold text-[#2A2823] mt-0.5">
                  {PRIMARY_TUTOR.studentsTrained} Murid
                </div>
              </div>

              <div className="p-2.5 rounded-[16px] bg-white/70 border border-[rgba(42,40,35,0.08)]">
                <div className="flex items-center gap-1 text-[10px] text-[#6B675F] font-semibold uppercase">
                  <Award className="w-3 h-3 text-[#3F5A46]" />
                  <span>Sertifikasi</span>
                </div>
                <div className="text-xs font-bold text-[#3F5A46] mt-0.5">Pedagogik Lulus</div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
              <button
                onClick={() => onRequestTutor(PRIMARY_TUTOR.name)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C1683F] hover:bg-[#A85530] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <span>Request Sesi Bersama {PRIMARY_TUTOR.name.split(',')[0]}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
