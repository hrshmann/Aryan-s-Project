/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'Admin' | 'Therapist' | 'User';
  age?: number;
  points: number;
  level: number;
  badges: string[]; // List of badge IDs
  createdAt?: string;
}

export interface Therapist {
  id: string;
  _id?: string;
  name: string;
  email: string;
  specialty: string;
  experience: number; // in years
  rating: number;
  imgUrl?: string;
  bio: string;
  availability: string[]; // hours or days e.g. ["Mon 9:00 AM", "Mon 2:00 PM", "Wed 11:00 AM", "Fri 3:00 PM"]
  pricePerSession: number;
  approved: boolean;
}

export interface Appointment {
  id: string;
  _id?: string;
  userId: string;
  userName: string;
  therapistId: string;
  therapistName: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g., "11:00 AM"
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  notes?: string;
  createdAt?: string;
}

export interface MoodRecord {
  id: string;
  _id?: string;
  userId: string;
  score: number; // 1-5 (1: Awful, 2: Bad, 3: Okay, 4: Good, 5: Fantastic)
  note: string; // Journal note
  tags: string[]; // e.g. ["Anxious", "Calm", "Tired", "Excited"]
  date: string; // YYYY-MM-DD
  createdAt?: string;
}

export interface Feedback {
  id: string;
  _id?: string;
  name: string;
  email: string;
  message: string;
  rating: number;
  createdAt?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  description: string;
  region: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  category: 'Anxiety' | 'Depression' | 'Mindfulness' | 'Relationships' | 'Sleep';
  summary: string;
  content: string;
  duration?: string; // read time
  imageUrl?: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  iconName: string; // Lucide icon identifier
  pointsRequired: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}
