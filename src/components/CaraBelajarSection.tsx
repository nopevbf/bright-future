import React from 'react';
import { FileEdit, UserCheck, Clock, QrCode } from 'lucide-react';

export const CaraBelajarSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Daftar & Alamat Rumah',
      desc: 'Isi formulir online singkat di bawah, tentukan jenjang sekolah anak, dan sertakan alamat rumah lengkap untuk pemetaan rute.',
      icon: <FileEdit className="w-5 h-5 text-[#3F5A46]" />,
      accentColor: 'text-[#3F5A46]/30',
    },
    {
      number: '02',
      title: 'Penugasan Tutor Terdekat',
      desc: 'Sistem mencocokkan profil anak dengan tutor terakreditasi terdekat yang memiliki keahlian mata pelajaran spesifik yang dibutuhkan.',
      icon: <UserCheck className="w-5 h-5 text-[#C1683F]" />,
      accentColor: 'text-[#C1683F]/30',
    },
    {
      number: '03',
      title: 'Visit 70 Mnt & Presensi',
      desc: 'Tutor hadir ke rumah Anda, presensi terverifikasi otomatis dengan geofence radius rumah, dan bimbingan belajar tatap muka dimulai.',
      icon: <Clock className="w-5 h-5 text-[#3F5A46]" />,
      accentColor: 'text-[#3F5A46]/30',
    },
    {
      number: '04',
      title: 'Pantau Nilai & Midtrans',
      desc: 'Pantau catatan progres di WhatsApp/portal dan lunasi SPP mudah via Midtrans Snap (QRIS, VA BCA, Mandiri) otomatis lunas.',
      icon: <QrCode className="w-5 h-5 text-[#C1683F]" />,
      accentColor: 'text-[#C1683F]/30',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14" id="cara-belajar">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs font-bold text-[#6F8F76] uppercase tracking-wider">
          Alur Praktis
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#2A2823] mt-1 font-display">
          4 Langkah Mudah Mulai Belajar di Rumah
        </h2>
        <p className="text-[#6B675F] text-sm sm:text-base mt-2">
          Tanpa proses birokrasi rumit. Dalam hitungan jam, jadwal tutor profesional siap terjadwal ke
          kediaman Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {steps.map((item, index) => (
          <div
            key={index}
            className="liquid-glass p-6 rounded-[22px] relative border border-white/80 hover:border-[#6F8F76]/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className={`text-3xl font-black font-display ${item.accentColor}`}>
                  {item.number}
                </div>
                <div className="p-2 rounded-xl bg-white/70 border border-[rgba(42,40,35,0.06)] shadow-xs">
                  {item.icon}
                </div>
              </div>

              <h3 className="text-base font-bold text-[#2A2823] font-display">{item.title}</h3>
              <p className="text-xs sm:text-sm text-[#6B675F] mt-2 leading-relaxed">{item.desc}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-[rgba(42,40,35,0.06)] text-[11px] font-semibold text-[#6F8F76]">
              Langkah {index + 1} dari 4
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
