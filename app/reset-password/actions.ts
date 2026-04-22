'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    return redirect(`/reset-password?error=${encodeURIComponent(error.message)}`)
  }

  return redirect('/?message=Contraseña actualizada correctamente')
}
