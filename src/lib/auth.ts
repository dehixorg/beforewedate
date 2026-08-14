import { cookies } from 'next/headers';
import { User } from './db/models/User';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const walletAddress = cookieStore.get('walletAddress')?.value || '0xME'; // Fallback to 0xME just in case

  const me = await User.findOne({ walletAddress });
  return me;
}
