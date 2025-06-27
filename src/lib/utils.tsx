import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { supabase } from "./supabase";
import { Star, Zap, Crown, Code, User, Briefcase, Phone } from "lucide-react";
import React from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric", 
    year: "numeric" 
  });
}

export function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", { 
    hour: "2-digit", 
    minute: "2-digit" 
  });
}

export function getScoreColor(score: number): string {
  if (score >= 90) return "#10b981"; // success-500
  if (score >= 75) return "#3b82f6"; // primary-500
  if (score >= 60) return "#f59e0b"; // warning-500
  return "#ef4444"; // error-500
}

export function getScoreTextColor(score: number): string {
  if (score >= 90) return "text-success-600";
  if (score >= 75) return "text-primary-600";
  if (score >= 60) return "text-warning-600";
  return "text-error-600";
}

export function getScoreBackgroundColor(score: number): string {
  if (score >= 90) return "bg-success-500";
  if (score >= 75) return "bg-primary-500";
  if (score >= 60) return "bg-warning-500";
  return "bg-error-500";
}

export function getScoreRating(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Satisfactory";
  return "Needs Improvement";
}

// Browser-compatible MD5 hash function for Gravatar
export function md5(str: string): string {
  // Simple MD5 implementation for browser compatibility
  function rotateLeft(value: number, amount: number): number {
    return (value << amount) | (value >>> (32 - amount));
  }

  function addUnsigned(x: number, y: number): number {
    return ((x & 0x7FFFFFFF) + (y & 0x7FFFFFFF)) ^ (x & 0x80000000) ^ (y & 0x80000000);
  }

  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, q), addUnsigned(x, t)), s), b);
  }

  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn((b & c) | ((~b) & d), a, b, x, s, t);
  }

  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn((b & d) | (c & (~d)), a, b, x, s, t);
  }

  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn(c ^ (b | (~d)), a, b, x, s, t);
  }

  function convertToWordArray(str: string): number[] {
    const wordArray: number[] = [];
    const messageLength = str.length;
    const numberOfWords = (((messageLength + 8) >>> 6) + 1) * 16;
    
    for (let i = 0; i < numberOfWords; i++) {
      wordArray[i] = 0;
    }
    
    for (let i = 0; i < messageLength; i++) {
      wordArray[i >>> 2] |= (str.charCodeAt(i) & 0xFF) << ((i % 4) * 8);
    }
    
    wordArray[messageLength >>> 2] |= 0x80 << ((messageLength % 4) * 8);
    wordArray[numberOfWords - 2] = messageLength * 8;
    
    return wordArray;
  }

  function wordToHex(value: number): string {
    let hex = '';
    for (let i = 0; i <= 3; i++) {
      const byte = (value >>> (i * 8)) & 255;
      hex += ('0' + byte.toString(16)).slice(-2);
    }
    return hex;
  }

  const x = convertToWordArray(str.trim().toLowerCase());
  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < x.length; i += 16) {
    const olda = a;
    const oldb = b;
    const oldc = c;
    const oldd = d;

    a = md5ff(a, b, c, d, x[i + 0], 7, -680876936);
    d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
    b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);

    a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = md5gg(b, c, d, a, x[i + 0], 20, -373897302);
    a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);

    a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
    d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = md5hh(d, a, b, c, x[i + 0], 11, -358537222);
    c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);

    a = md5ii(a, b, c, d, x[i + 0], 6, -198630844);
    d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);

    a = addUnsigned(a, olda);
    b = addUnsigned(b, oldb);
    c = addUnsigned(c, oldc);
    d = addUnsigned(d, oldd);
  }

  return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
}

// Generate Gravatar URL from email
export function generateGravatarUrl(email: string, size: number = 80, defaultImage: string = 'identicon'): string {
  if (!email) return `https://www.gravatar.com/avatar/?s=${size}&d=${defaultImage}`;
  
  // Trim whitespace and convert to lowercase
  const normalizedEmail = email.trim().toLowerCase();
  
  // Generate MD5 hash
  const hash = md5(normalizedEmail);
  
  // Construct and return Gravatar URL
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultImage}`;
}

// Get icon component by name
export function getPlanIconComponent(iconName: string): React.ReactNode {
  switch (iconName) {
    case 'Star':
      return <Star className="h-6 w-6" />;
    case 'Zap':
      return <Zap className="h-6 w-6" />;
    case 'Crown':
      return <Crown className="h-6 w-6" />;
    case 'Code':
      return <Code className="h-6 w-6" />;
    case 'User':
      return <User className="h-6 w-6" />;
    case 'Briefcase':
      return <Briefcase className="h-6 w-6" />;
    case 'Phone':
      return <Phone className="h-6 w-6" />;
    default:
      return <Star className="h-6 w-6" />;
  }
}

// Get the current domain for OAuth redirects
export const getRedirectUrl = () => {
  // In development or Bolt preview, use current origin
  if (window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('bolt.new') ||
      window.location.hostname.includes('stackblitz.com')) {
    return `${window.location.origin}/dashboard`;
  }
  
  // In production, use the current domain
  return `${window.location.origin}/dashboard`;
};

// Get the base URL for the current environment
export const getBaseUrl = () => {
  return window.location.origin;
};

// Helper function to validate UUID format
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Helper function to check if Supabase is properly configured
function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  return !!(url && 
           key && 
           url !== 'your-supabase-url' && 
           url.startsWith('http') &&
           key !== 'your-supabase-anon-key');
}

// Supabase utility functions
export async function fetchInterviewTypes() {
  // Check if Supabase is configured before making requests
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, using fallback data');
    return [
      {
        type: "technical",
        title: "Technical",
        description: "Coding, system design, and technical knowledge questions",
        icon: "Code",
      },
      {
        type: "behavioral", 
        title: "Behavioral",
        description: "Questions about your past experiences and situations",
        icon: "User",
      },
      {
        type: "mixed",
        title: "Mixed",
        description: "Combination of technical and behavioral questions",
        icon: "Briefcase",
      },
    ];
  }

  try {
    const { data, error } = await supabase
      .from('interview_types')
      .select('*');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching interview types:', error);
    // Fall back to the static data
    return [
      {
        type: "technical",
        title: "Technical",
        description: "Coding, system design, and technical knowledge questions",
        icon: "Code",
      },
      {
        type: "behavioral", 
        title: "Behavioral",
        description: "Questions about your past experiences and situations",
        icon: "User",
      },
      {
        type: "mixed",
        title: "Mixed",
        description: "Combination of technical and behavioral questions",
        icon: "Briefcase",
      },
    ];
  }
}

export async function fetchExperienceLevels() {
  // Check if Supabase is configured before making requests
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, using fallback data');
    return [
      { value: "entry", label: "Entry Level (0-2 years)" },
      { value: "mid", label: "Mid Level (3-5 years)" },
      { value: "senior", label: "Senior Level (6+ years)" },
    ];
  }

  try {
    const { data, error } = await supabase
      .from('experience_levels')
      .select('*');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching experience levels:', error);
    // Fall back to the static data
    return [
      { value: "entry", label: "Entry Level (0-2 years)" },
      { value: "mid", label: "Mid Level (3-5 years)" },
      { value: "senior", label: "Senior Level (6+ years)" },
    ];
  }
}

export async function fetchDifficultyLevels() {
  // Check if Supabase is configured before making requests
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, using fallback data');
    return [
      { value: "easy", label: "Easy - Beginner friendly questions" },
      { value: "medium", label: "Medium - Standard interview difficulty" },
      { value: "hard", label: "Hard - Challenging interview questions" },
    ];
  }

  try {
    const { data, error } = await supabase
      .from('difficulty_levels')
      .select('*');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching difficulty levels:', error);
    // Fall back to the static data
    return [
      { value: "easy", label: "Easy - Beginner friendly questions" },
      { value: "medium", label: "Medium - Standard interview difficulty" },
      { value: "hard", label: "Hard - Challenging interview questions" },
    ];
  }
}

// Get conversation minutes for a user
export async function getConversationMinutes(userId: string): Promise<{total: number, used: number, remaining: number} | null> {
  // Check if Supabase is configured before making requests
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, using fallback data');
    return {
      total: 60,
      used: 15,
      remaining: 45
    };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('total_conversation_minutes, used_conversation_minutes')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    return {
      total: data.total_conversation_minutes || 0,
      used: data.used_conversation_minutes || 0,
      remaining: (data.total_conversation_minutes || 0) - (data.used_conversation_minutes || 0)
    };
  } catch (error) {
    console.error('Error fetching conversation minutes:', error);
    return null;
  }
}
export async function fetchUserInterviews(userId: string) {
  // Check if Supabase is configured before making requests
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, returning empty array');
    return [];
  }

  try {
    // Check if userId is a valid UUID before making Supabase query
    if (!isValidUUID(userId)) {
      console.warn(`Invalid UUID format for user ID: ${userId}, returning empty array`);
      return [];
    }

    console.log('🔍 fetchUserInterviews: Fetching interviews for user', userId);
    const { data, error } = await supabase
      .from('interviews')
      .select(`
        *,
        interview_types (type, title),
        experience_levels (value, label),
        difficulty_levels (value, label)
      `)
      .eq('user_id', userId)
      .order('scheduled_at', { ascending: false });
    
    if (error) throw error;
    console.log('🔍 fetchUserInterviews: Fetched', data?.length || 0, 'interviews');
    return data || [];
  } catch (error) {
    console.error('Error fetching interviews:', error);
    console.log('🔍 fetchUserInterviews: Error, returning empty array');
    return [];
  }
}

export async function fetchInterviewQuestions(interviewId: string) {
  // Check if Supabase is configured before making requests
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, returning empty array');
    return [];
  }

  // Note: interview_questions and questions tables don't exist in current schema
  // This functionality is not implemented yet
  console.warn('Interview questions functionality not implemented in current schema');
  return [];
}

export async function fetchInterviewFeedback(interviewId: string) {
  // Check if Supabase is configured before making requests
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, returning null');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('interview_id', interviewId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    return data;
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return null;
  }
}