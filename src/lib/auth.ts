import { supabase } from './supabase'

export type Role = 'customer' | 'builder_admin' | 'site_staff'

export function homeFor(role: Role) {
  if (role === 'builder_admin') return '/builder'
  if (role === 'site_staff') return '/staff'
  return '/customer'
}

export type Profile = {
  id: string
  role: Role
  full_name: string | null
  phone: string | null
  created_at: string
}

const PENDING_BOOKING_KEY = 'sankalp:pending-booking-code'
const PENDING_STAFF_INVITE_KEY = 'sankalp:pending-staff-invite'

export function stashPendingBookingCode(email: string, code: string) {
  localStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify({ email, code }))
}

export function takePendingBookingCode(email: string): string | null {
  const raw = localStorage.getItem(PENDING_BOOKING_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { email: string; code: string }
    if (parsed.email !== email) return null
    localStorage.removeItem(PENDING_BOOKING_KEY)
    return parsed.code
  } catch {
    return null
  }
}

export function stashPendingStaffInvite(email: string, code: string) {
  localStorage.setItem(PENDING_STAFF_INVITE_KEY, JSON.stringify({ email, code }))
}

export function takePendingStaffInvite(email: string): string | null {
  const raw = localStorage.getItem(PENDING_STAFF_INVITE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { email: string; code: string }
    if (parsed.email !== email) return null
    localStorage.removeItem(PENDING_STAFF_INVITE_KEY)
    return parsed.code
  } catch {
    return null
  }
}

export async function claimBooking(code: string, customerId: string) {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
    .from('bookings')
    .update({ customer_profile_id: customerId })
    .eq('booking_code', code.trim())
    .is('customer_profile_id', null)
    .select()
    .single()
}

export async function signUpCustomer(params: {
  email: string
  password: string
  fullName: string
  bookingCode: string
}) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { email, password, fullName, bookingCode } = params

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: 'customer', full_name: fullName } },
  })
  if (error) return { error, needsEmailConfirmation: false }

  if (!data.session) {
    stashPendingBookingCode(email, bookingCode)
    return { error: null, needsEmailConfirmation: true }
  }

  const { error: claimError } = await claimBooking(bookingCode, data.user!.id)
  if (claimError) return { error: claimError, needsEmailConfirmation: false }

  return { error: null, needsEmailConfirmation: false }
}

export async function signUpBuilder(params: {
  email: string
  password: string
  fullName: string
  companyName: string
}) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { email, password, fullName, companyName } = params

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: 'builder_admin', full_name: fullName, company_name: companyName } },
  })
  return { error, needsEmailConfirmation: !error }
}

export async function claimStaffInvite(code: string, profileId: string) {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
    .from('staff_members')
    .update({ profile_id: profileId })
    .eq('invite_code', code.trim())
    .is('profile_id', null)
    .select()
    .single()
}

export async function signUpStaff(params: {
  email: string
  password: string
  fullName: string
  inviteCode: string
}) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { email, password, fullName, inviteCode } = params

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: 'site_staff', full_name: fullName } },
  })
  if (error) return { error, needsEmailConfirmation: false }

  if (!data.session) {
    stashPendingStaffInvite(email, inviteCode)
    return { error: null, needsEmailConfirmation: true }
  }

  const { error: claimError } = await claimStaffInvite(inviteCode, data.user!.id)
  if (claimError) return { error: claimError, needsEmailConfirmation: false }

  return { error: null, needsEmailConfirmation: false }
}

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase.auth.signOut()
}
