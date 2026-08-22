import { jwtVerify, SignJWT } from 'jose';

const getSecret = () => new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'fallback_secret_for_dev_only_123456');

export async function signAdminToken() {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(getSecret());
}

export async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.role === 'admin';
  } catch (error) {
    return false;
  }
}
