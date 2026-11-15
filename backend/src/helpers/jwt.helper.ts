import jwt from 'jsonwebtoken';

/** Signs and verifies short-lived access tokens. */
export interface JwtHelper {
  /** Creates an access token for a user and reports its lifetime in seconds. */
  sign(userId: number): { token: string; expiresInSeconds: number };
  /** Returns the user id inside a valid token, or null when it is invalid or expired. */
  verify(token: string): number | null;
}

/** Builds the access-token helper from the signing secret and lifetime (for example "15m"). */
export function createJwtHelper(secret: string, ttl: string): JwtHelper {
  return {
    sign(userId) {
      const token = jwt.sign({}, secret, {
        subject: String(userId),
        expiresIn: ttl as jwt.SignOptions['expiresIn'],
        algorithm: 'HS256',
      });
      const decoded = jwt.decode(token) as { exp: number; iat: number };
      return { token, expiresInSeconds: decoded.exp - decoded.iat };
    },
    verify(token) {
      try {
        const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
        const subject = typeof payload === 'string' ? undefined : payload.sub;
        const id = Number(subject);
        return Number.isInteger(id) && id > 0 ? id : null;
      } catch {
        return null;
      }
    },
  };
}
