import { supabase } from '@/lib/supabase'

// Fail closed: if the setting is missing or cannot be loaded, customer
// ordering stays unavailable until an admin enables it.
export async function isCustomerOrderingEnabled(): Promise<boolean> {
  const { data, error } = await supabase
    .from('website_settings')
    .select('customer_orders_enabled')
    .single()

  return !error && data?.customer_orders_enabled === true
}
