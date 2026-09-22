import React, { useState } from 'react';
import { FAQS } from '../data';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14" id="faq">
      <div className="text-center mb-10">
        <span className="text-xs font-bold text-[#6F8F76] uppercase tracking-wider">
          Tanya Jawab
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#2A2823] mt-1 font-display">
          Pertanyaan Seputar Layanan &amp; Ketentuan
        </h2>
        <p className="text-[#6B675F] text-xs sm:text-sm mt-2">
          Segala hal yang perlu diketahui tentang sistem bimbingan belajar, pembayaran, dan jadwal.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={faq.id}
              className={`rounded-[20px] transition-all duration-200 border ${
                isOpen
                  ? 'liquid-glass border-[#3F5A46]/30 shadow-glass'
                  : 'bg-white/60 hover:bg-white/90 border-[rgba(42,40,35,0.08)]'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-full bg-[#EAF2ED] text-[#3F5A46] text-[10px] font-bold uppercase shrink-0">
                    {faq.category}
                  </span>
                  <span className="font-bold text-[#2A2823] text-sm sm:text-base font-display">
                    {faq.question}
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-[#3F5A46] transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#6B675F] leading-relaxed border-t border-[rgba(42,40,35,0.06)]">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
