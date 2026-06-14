import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://moyxooeslqyjcfaymcxu.supabase.co'
const supabaseAnonKey = 'sb_publishable_Mry-tACD_IoVBhKJbsV-oQ_O2C2JoIn'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)