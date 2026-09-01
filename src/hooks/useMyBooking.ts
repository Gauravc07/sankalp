import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export type MyBooking = {
  id: string
  booking_code: string
  status: string
  unit: {
    id: string
    unit_number: string
    floor: number | null
    unit_type: string | null
    carpet_area_sqft: number | null
    list_price: number | null
    parking_details: string | null
    unit_charges: { id: string; charge_name: string; amount: number }[]
    tower: {
      id: string
      name: string
      total_floors: number | null
      project: {
        id: string
        name: string
        city: string | null
        address: string | null
        map_embed_url: string | null
        rera_registration_number: string | null
        rera_registered_name: string | null
        rera_status: string
        rera_certificate_url: string | null
        rera_valid_till: string | null
        builder: { id: string; name: string }
      }
    }
  }
}

export function useMyBooking() {
  const { profile } = useAuth()
  const [booking, setBooking] = useState<MyBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profile || !supabase) {
      setLoading(false)
      return
    }

    let cancelled = false

    supabase
      .from('bookings')
      .select(
        `id, booking_code, status,
         unit:units(id, unit_number, floor, unit_type, carpet_area_sqft, list_price, parking_details,
           unit_charges(id, charge_name, amount),
           tower:towers(id, name, total_floors,
             project:projects(id, name, city, address, map_embed_url, rera_registration_number,
               rera_registered_name, rera_status, rera_certificate_url, rera_valid_till,
               builder:builders(id, name))))`,
      )
      .eq('customer_profile_id', profile.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        if (fetchError) setError(fetchError.message)
        setBooking(data as unknown as MyBooking | null)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [profile])

  return { booking, loading, error }
}
