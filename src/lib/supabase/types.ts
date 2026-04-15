import type { SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- pas de types generes, a remplacer par Database quand supabase gen types sera configure
export type ServiceClient = SupabaseClient<any, any, any>
