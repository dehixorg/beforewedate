'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function sendOtp(formData: FormData) {
  const phone = formData.get('phone') as string
  if (!phone) return { error: 'Phone number is required' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    phone,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, phone }
}

export async function verifyOtp(formData: FormData) {
  const phone = formData.get('phone') as string
  const token = formData.get('token') as string

  if (!phone || !token) return { error: 'Phone and code are required' }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  })

  if (error) {
    return { error: error.message }
  }

  // Redirect to demo instead of non-existent onboarding
  redirect('/demo')
}
