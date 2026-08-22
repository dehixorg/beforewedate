'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signAdminToken } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function adminLogin(password: string) {
  if (password === process.env.ADMIN_PASSWORD) {
    const token = await signAdminToken();
    const cookieStore = await cookies();
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 2, // 2 hours
    });
    redirect('/');
  } else {
    throw new Error('Invalid password');
  }
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
  redirect('/login');
}

export async function suspendUser(userId: string) {
  const supabase = createAdminClient();
  
  const { error } = await supabase
    .from('users')
    .update({ status: 'paused' })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to suspend user: ${error.message}`);
  }

  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);
}
