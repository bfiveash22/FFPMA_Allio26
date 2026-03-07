import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';
import { apiKeys, apiAuditLogs } from '@shared/schema';

const PREVIEW_TOKEN_SECRET = process.env.NODE_ENV === 'production'
  ? process.env.PREVIEW_TOKEN_SECRET || ''
  : process.env.PREVIEW_TOKEN_SECRET || 'ffpma_preview_2026';
const isDevMode = process.env.NODE_ENV !== 'production';

function isValidPreviewMode(req: Request): boolean {
  const previewHeader = req.headers['x-preview-mode'];
  if (previewHeader !== 'trustee') return false;

  const previewToken = req.headers['x-preview-token'] as string;
  if (previewToken) {
    if (!PREVIEW_TOKEN_SECRET) {
      console.log('[AUTH] Preview Mode rejected: PREVIEW_TOKEN_SECRET not set in production');
      return false;
    }
    const expectedToken = crypto.createHmac('sha256', PREVIEW_TOKEN_SECRET)
      .update('trustee-preview')
      .digest('hex')
      .substring(0, 16);
    try {
      return crypto.timingSafeEqual(
        Buffer.from(previewToken, 'utf8'),
        Buffer.from(expectedToken, 'utf8')
      );
    } catch {
      return false;
    }
  }

  return isDevMode;
}

async function validateApiKey(req: Request): Promise<{ valid: boolean; keyId?: string; permissions?: string[] }> {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer allio_')) {
    return { valid: false };
  }

  const rawKey = authHeader.substring(7);
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  try {
    const rows = await db.select().from(apiKeys)
      .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.isActive, true)));

    if (rows.length === 0) return { valid: false };

    await db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, rows[0].id));

    return { valid: true, keyId: rows[0].id, permissions: rows[0].permissions };
  } catch (err: any) {
    console.error('[AUTH] API key validation error:', err.message);
    return { valid: false };
  }
}

function getAuthSource(req: Request): { type: string; id: string | null } {
  const r = req as any;
  if (r.apiKeyId) return { type: 'apiKey', id: r.apiKeyId };
  if (r.headers['x-preview-mode'] === 'trustee') return { type: 'preview', id: null };
  if (r.user?.claims?.sub) return { type: 'session', id: r.user.claims.sub };
  return { type: 'anonymous', id: null };
}

export function auditLog() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalEnd = res.end;

    res.end = function(this: Response, ...args: any[]) {
      const responseTimeMs = Date.now() - startTime;
      const source = getAuthSource(req);

      db.insert(apiAuditLogs).values({
        method: req.method,
        path: req.path,
        sourceType: source.type,
        sourceId: source.id,
        statusCode: res.statusCode,
        responseTimeMs,
        ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null,
      }).catch((err: any) => {
        console.error('[AUDIT] Failed to log:', err.message);
      });

      return originalEnd.apply(this, args as any);
    } as any;

    next();
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const r = req as any;
  const isAuth = r.isAuthenticated ? r.isAuthenticated() : false;
  const hasSub = !!r.user?.claims?.sub;

  if (isAuth && hasSub) {
    return next();
  }

  console.log(`[AUTH MIDDLEWARE] 401 on ${req.method} ${req.path} | isAuthenticated=${isAuth} hasSub=${hasSub} hasSession=${!!r.session?.id} hasCookie=${!!req.headers.cookie}`);
  return res.status(401).json({ error: 'Authentication required' });
}

export function requireRole(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const r = req as any;
    const isAuth = r.isAuthenticated ? r.isAuthenticated() : false;
    const hasSub = !!r.user?.claims?.sub;

    if (!isAuth || !hasSub) {
      if (allowedRoles.includes('admin')) {
        const apiResult = await validateApiKey(req);
        if (apiResult.valid) {
          const method = req.method.toUpperCase();
          const needsWrite = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
          if (needsWrite && apiResult.permissions && !apiResult.permissions.includes('write')) {
            return res.status(403).json({ error: 'API key lacks write permission' });
          }
          r.apiKeyId = apiResult.keyId;
          r.apiKeyPermissions = apiResult.permissions;
          return next();
        }
        if (isValidPreviewMode(req)) {
          return next();
        }
      }
      console.log(`[AUTH MIDDLEWARE] 401 on ${req.method} ${req.path} | isAuthenticated=${isAuth} hasSub=${hasSub} hasSession=${!!r.session?.id} hasCookie=${!!req.headers.cookie}`);
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const userId = r.user.claims.sub;
      const { users, memberProfiles } = await import('@shared/schema');

      const profileRows = await db.select().from(memberProfiles).where(eq(memberProfiles.userId, userId));
      if (profileRows.length > 0 && allowedRoles.includes(profileRows[0].role)) {
        return next();
      }

      const userRows = await db.select().from(users).where(eq(users.id, userId));
      if (userRows.length > 0) {
        const wpRolesStr = userRows[0].wpRoles || '';
        const rolesArray = wpRolesStr.split(',').map((r: string) => r.trim()).filter(Boolean);

        let role = 'member';
        if (rolesArray.includes('administrator') || rolesArray.includes('shop_manager')) {
          role = 'admin';
        } else if (rolesArray.includes('doctor') || rolesArray.includes('physician')) {
          role = 'doctor';
        }

        if (allowedRoles.includes(role)) {
          return next();
        }
      }

      console.log(`[AUTH MIDDLEWARE] 403 on ${req.method} ${req.path} | userId=${userId} roles=${allowedRoles}`);
      return res.status(403).json({ error: 'Insufficient permissions' });
    } catch (error: any) {
      console.error('[AUTH MIDDLEWARE] Role check error:', error.message);
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}
