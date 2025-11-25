import * as jwt from 'jsonwebtoken'

const JWT_SECRET: jwt.Secret = (process.env.JWT_SECRET ?? 'dev-secret') as jwt.Secret
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d'

export function signToken(payload: Record<string, any>): string {
  const options: jwt.SignOptions = { expiresIn: JWT_EXPIRES_IN as any }
  return jwt.sign(payload as string | Buffer | jwt.JwtPayload, JWT_SECRET, options)
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return null
  }
}

export default {
  signToken,
  verifyToken,
}
