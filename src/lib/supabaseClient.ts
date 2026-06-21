/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validates whether the Supabase configurations are set up
export const isSupabaseConfigured = 
  supabaseUrl.trim() !== '' && 
  supabaseAnonKey.trim() !== '' && 
  !supabaseUrl.includes('YOUR_SUPABASE') && 
  !supabaseAnonKey.includes('YOUR_SUPABASE');

if (!isSupabaseConfigured) {
  console.warn(
    "EcoTwin: Supabase keys are missing or unconfigured in .env.local. " +
    "Running in Local Storage / Guest Mode fallback."
  );
}

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
