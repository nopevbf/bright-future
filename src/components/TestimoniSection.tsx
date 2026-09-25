import React from 'react';
import { TESTIMONIALS } from '../data';
import { Star, ShieldCheck, Quote } from 'lucide-react';

export const TestimoniSection: React.FC = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 scroll-mt-28" id="testimoni">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-bold text-[#C1683F] uppercase tracking-wider">
          Kisah Pengalaman
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#2A2823] mt-1 font-display">
          Dipercaya Ayah &amp; Bunda di Kabupaten Magelang
        </h2>
        <p className="text-[#6B675F] text-sm sm:text-base mt-2">
          Ketenangan batin orang tua ketika melihat proses belajar anak berlangsung tertib,
          transparan, dan prestasinya meningkat nyata.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((item) => (
          <div
            key={item.id}
            className="liquid-glass p-7 rounded-[26px] border border-white/85 flex flex-col justify-between shadow-glass relative hover:border-[#6F8F76]/40 transition-all duration-200"
          >
            <div>
              {/* Star Rating */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1 text-[#C1683F]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#C1683F]" />
                  ))}
                  <span className="text-xs text-[#2A2823] font-bold ml-1">5.0</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EAF2ED] text-[#3F5A46] text-[10px] font-bold uppercase">
                  {item.studentLevel}
                </span>
              </div>

              {/* Comment */}
              <blockquote className="text-[#2A2823] text-xs sm:text-sm leading-relaxed italic whitespace-pre-line">
                "{item.comment}"
              </blockquote>
            </div>

            {/* Author Profile */}
            <div className="mt-6 pt-4 border-t border-[rgba(42,40,35,0.08)] flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#EAF2ED] text-[#3F5A46] font-extrabold flex items-center justify-center shrink-0 text-sm shadow-xs">
                {item.initials}
              </div>
              <div>
                <div className="font-bold text-sm text-[#2A2823]">{item.name}</div>
                <div className="text-[11px] text-[#6B675F]">{item.role}</div>
                <div className="text-[10px] text-[#6F8F76] font-medium">{item.location}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
