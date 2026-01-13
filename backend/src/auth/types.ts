export interface JwtPayload {
  sub: string;
  email?: string;
  [key: string]: any;
}

export interface SupabaseJwtClaims extends JwtPayload {
  sub: string; // User ID
  email?: string;
  aud: string; // Audience
  role: string; // User role
  iat: number; // Issued at
  exp: number; // Expiration
}
