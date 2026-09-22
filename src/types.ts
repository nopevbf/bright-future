export type EducationalLevel = 'tk' | 'sd' | 'smp' | 'sma';

export interface ProgramDetail {
  id: EducationalLevel;
  levelTitle: string;
  badge: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  pricePerSession: number;
  durationMinutes: number;
  monthlySessions: number;
  monthlyPrice: number;
  colorScheme: 'sage' | 'terracotta';
}

export interface TutorProfile {
  name: string;
  title: string;
  role: string;
  rating: number;
  photoUrl: string;
  quote: string;
  hoursFlight: string;
  studentsTrained: number;
  certification: string;
  specialties: string[];
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  location: string;
  rating: number;
  comment: string;
  initials: string;
  studentLevel: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface RegistrationFormData {
  studentName: string;
  level: EducationalLevel | '';
  parentName: string;
  whatsapp: string;
  homeAddress: string;
  addressNotes?: string;
  selectedSchedule: string[];
  specialNotes?: string;
  hasSiblingDiscount?: boolean;
}

export interface SubmittedRegistration extends RegistrationFormData {
  studentId: string;
  invoiceNumber: string;
  totalAmount: number;
  submittedAt: string;
}
