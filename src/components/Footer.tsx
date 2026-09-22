import React from 'react';
import { COVERAGE_AREAS } from '../data';
import { Phone, Mail, ShieldCheck, MapPin, ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full border-t border-[rgba(42,40,35,0.10)] bg-[#F1ECE1]/70 mt-16 text-[#6B675F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="/logo.svg"
                alt="Bright Future"
                className="h-11 w-11 rounded-full object-cover shadow-xs"
                referrerPolicy="no-referrer"
              />
              <span className="font-display font-extrabold text-lg text-[#3F5A46]">
                Bright Future
              </span>
            </div>
            <p className="text-xs text-[#6B675F] leading-relaxed">
              Digital Learning Center &amp; Platform Manajemen Bimbel Privat House-to-House
              terkemuka dengan monitoring geofence, modul LKPD interaktif, dan integrasi Midtrans
              Snap.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF2ED] text-[#3F5A46] text-[11px] font-bold">
              <ShieldCheck className="w-4 h-4 text-[#6F8F76]" />
              <span>Bimbel Resmi Terakreditasi 2026</span>
            </div>
          </div>

          {/* Hotline Kontak */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-[#2A2823] uppercase tracking-wider font-display">
              Kontak &amp; Dispatch Hotline
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-[16px] bg-white/80 border border-[rgba(42,40,35,0.08)] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#EAF2ED] flex items-center justify-center text-[#3F5A46]">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-[#6B675F] uppercase font-semibold">
                    WhatsApp Hotline
                  </div>
                  <a
                    href="https://wa.me/6281234567890"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#3F5A46] hover:underline"
                  >
                    +62 812-3456-7890
                  </a>
                </div>
              </div>

              <div className="p-3 rounded-[16px] bg-white/80 border border-[rgba(42,40,35,0.08)] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#EFC9AE]/50 flex items-center justify-center text-[#C1683F]">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-[#6B675F] uppercase font-semibold">
                    Email Operasional
                  </div>
                  <div className="font-bold text-[#2A2823]">halo@brightfuture.id</div>
                </div>
              </div>
            </div>
          </div>

          {/* Cakupan Wilayah Home-Visit */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-[#2A2823] uppercase tracking-wider font-display">
              Wilayah Layanan Kunjungan
            </h4>
            <ul className="text-xs text-[#6B675F] space-y-1.5">
              {COVERAGE_AREAS.slice(0, 5).map((area, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#6F8F76] shrink-0 mt-0.5" />
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tautan Navigasi Singkat */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-[#2A2823] uppercase tracking-wider font-display">
              Navigasi Cepat
            </h4>
            <div className="flex flex-col space-y-1.5 text-xs text-[#6B675F]">
              <a href="#program" className="hover:text-[#3F5A46] transition-colors">
                Program Belajar TK - SMA
              </a>
              <a href="#tentang" className="hover:text-[#3F5A46] transition-colors">
                Tentang Transformasi Digital
              </a>
              <a href="#tutor" className="hover:text-[#3F5A46] transition-colors">
                Profil Tutor &amp; Sertifikasi
              </a>
              <a href="#cara-belajar" className="hover:text-[#3F5A46] transition-colors">
                Panduan Sistem Geofence
              </a>
              <a href="#form-daftar" className="hover:text-[#C1683F] font-bold transition-colors">
                Pendaftaran Siswa Baru
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-[rgba(42,40,35,0.10)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B675F]">
          <p>© 2026 Bright Future Learning &amp; Tutoring. Seluruh hak cipta dilindungi undang-undang.</p>
          <div className="flex items-center gap-4">
            <a href="#beranda" className="hover:underline hover:text-[#2A2823]">
              Kebijakan Privasi
            </a>
            <a href="#beranda" className="hover:underline hover:text-[#2A2823]">
              Syarat &amp; Ketentuan
            </a>
            <a href="#beranda" className="hover:underline hover:text-[#2A2823]">
              Standar Keselamatan Siswa
            </a>
            <button
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-white hover:bg-[#FAF7F1] border border-[rgba(42,40,35,0.08)] text-[#3F5A46] cursor-pointer"
              title="Kembali ke Atas"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
