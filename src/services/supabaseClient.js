import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://hxddfnmjdcaqtvxsgbia.supabase.co"
const supabaseAnonKey = "sb_publishable_VdT7ylGkIoWVzo29_ikjig_5G01s44U"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)