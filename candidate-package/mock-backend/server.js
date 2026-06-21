/**
 * JamJoys Mock Backend — zero-dependency Node HTTP server.
 *
 * A self-contained stand-in for the real JamJoys NestJS backend, implementing
 * the exact endpoints, request/response shapes, and "verified backend facts"
 * the candidate app relies on. It needs NO npm install — only Node.js 18+.
 *
 *   node server.js                 # listens on http://localhost:3000
 *   PORT=4000 node server.js       # custom port
 *   ACCESS_TOKEN_TTL=30 node ...   # short access-token TTL (sec) to test refresh
 *
 * Honored backend facts:
 *  - Phone format ^09\d{9}$ ; OTP valid 5 min, max 3 attempts.
 *  - POST /auth/send-otp returns the dev `otp` in the response body (non-prod).
 *  - POST /auth/refresh takes { refreshToken } and returns ONLY { accessToken }.
 *  - POST /games/:id/view requires a UUID id (400 otherwise).
 *  - GET /videos/:id/validate-access returns { hasAccess, message }.
 *
 * Data is in-memory and reset on every restart.
 */

'use strict';

const http = require('http');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
// Access token lifetime. Default 15 min (matches the real backend). Lower it
// (e.g. ACCESS_TOKEN_TTL=20) to exercise the 401 -> refresh -> retry flow fast.
const ACCESS_TOKEN_TTL = Number(process.env.ACCESS_TOKEN_TTL || 15 * 60);
const REFRESH_TOKEN_TTL = Number(process.env.REFRESH_TOKEN_TTL || 7 * 24 * 60 * 60);
const OTP_TTL = 5 * 60; // 5 minutes
const OTP_MAX_ATTEMPTS = 3;

const PHONE_RE = /^09\d{9}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// In-memory data
// ---------------------------------------------------------------------------

/** users keyed by id */
const users = new Map();
/** phone -> userId */
const usersByPhone = new Map();
/** phone -> { otp, expiresAt, attempts } */
const otps = new Map();
/** userId -> Set<gameId> favorites */
const favorites = new Map();
/** userId -> Set<gameId> wishlist */
const wishlist = new Map();
/** userId -> Map<videoId, { videoId, progress, updatedAt }> */
const watchHistory = new Map();
/** userId -> token balance */
const tokenBalances = new Map();

function uuid() {
  return crypto.randomUUID();
}

// Stable seed UUIDs so links are reproducible across restarts.
const GID = {
  haftSang: '11111111-1111-4111-8111-111111111111',
  alak: '22222222-2222-4222-8222-222222222222',
  golYaPooch: '33333333-3333-4333-8333-333333333333',
  lakkoDori: '44444444-4444-4444-8444-444444444444',
  gorgomBazi: '55555555-5555-4555-8555-555555555555',
  yegholeDoghol: '66666666-6666-4666-8666-666666666666',
  zooBaazi: '77777777-7777-4777-8777-777777777777',
  tabBazi: '88888888-8888-4888-8888-888888888888',
};
const VID = {
  haftSangIntro: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  haftSangPro: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  alakIntro: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  golIntro: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
  lakkoIntro: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
  gorgomIntro: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
  yegholIntro: 'ffffffff-ffff-4fff-8fff-fffffffffff1',
  zooIntro: 'a1b2c3d4-0000-4000-8000-000000000001',
  tabIntro: 'a1b2c3d4-0000-4000-8000-000000000002',
};

/** Videos keyed by id. `premium` videos require an active subscription. */
const videos = new Map([
  [VID.haftSangIntro, { id: VID.haftSangIntro, title: 'هفت‌سنگ — آموزش پایه', description: 'قوانین و چیدمان اولیه', duration: 320, thumbnail: null, premium: false }],
  [VID.haftSangPro, { id: VID.haftSangPro, title: 'هفت‌سنگ — تکنیک‌های پیشرفته', description: 'برای بازیکنان حرفه‌ای', duration: 540, thumbnail: null, premium: true }],
  [VID.alakIntro, { id: VID.alakIntro, title: 'الک‌دولک — آموزش پایه', description: 'نحوهٔ ضربه و امتیازگیری', duration: 280, thumbnail: null, premium: false }],
  [VID.golIntro, { id: VID.golIntro, title: 'گل‌یا‌پوچ — آموزش', description: 'ترفندهای حدس زدن', duration: 210, thumbnail: null, premium: false }],
  [VID.lakkoIntro, { id: VID.lakkoIntro, title: 'لک‌و‌دوری — آموزش', description: 'بازی محلی با چوب و حلقه', duration: 245, thumbnail: null, premium: false }],
  [VID.gorgomIntro, { id: VID.gorgomIntro, title: 'گرگم‌به‌هوا — آموزش', description: 'بازی دونده و گریز', duration: 300, thumbnail: null, premium: false }],
  [VID.yegholIntro, { id: VID.yegholIntro, title: 'یه‌قل‌دوقل — آموزش', description: 'بازی با پنج سنگ‌ریزه', duration: 260, thumbnail: null, premium: true }],
  [VID.zooIntro, { id: VID.zooIntro, title: 'زو — آموزش', description: 'بازی نفس‌گیر گروهی', duration: 330, thumbnail: null, premium: false }],
  [VID.tabIntro, { id: VID.tabIntro, title: 'تب‌بازی — آموزش', description: 'بازی تعادل و سرعت', duration: 200, thumbnail: null, premium: false }],
]);

const CAT = {
  group: { name: 'گروهی', label: 'بازی گروهی', color: '#4ea1ff' },
  skill: { name: 'مهارتی', label: 'بازی مهارتی', color: '#3fb950' },
  mind: { name: 'فکری', label: 'بازی فکری', color: '#d29922' },
  active: { name: 'تحرکی', label: 'بازی تحرکی', color: '#f85149' },
};
const DIFF = {
  easy: { name: 'آسان', label: 'سطح آسان', level: 1 },
  medium: { name: 'متوسط', label: 'سطح متوسط', level: 2 },
  hard: { name: 'سخت', label: 'سطح سخت', level: 3 },
};

/**
 * Games. Display values (category/difficulty labels) are provided via the
 * `categoryConfig` / `difficultyConfig` objects, mirroring the real backend.
 * `featured: true` games are returned by `GET /games/featured`.
 */
const games = [
  {
    id: GID.haftSang, slug: 'haft-sang', title: 'هفت‌سنگ',
    description: 'بازی سنتی هفت‌سنگ با توپ و چیدن سنگ‌ها.',
    thumbnail: null, category: null, difficulty: null,
    categoryConfig: CAT.group, difficultyConfig: DIFF.medium,
    featured: true, viewCount: 0, videoIds: [VID.haftSangIntro, VID.haftSangPro],
  },
  {
    id: GID.alak, slug: 'alak-dolak', title: 'الک‌دولک',
    description: 'بازی سنتی با دو چوب، نیازمند دقت و هماهنگی.',
    thumbnail: null, category: null, difficulty: null,
    categoryConfig: CAT.skill, difficultyConfig: DIFF.hard,
    featured: true, viewCount: 0, videoIds: [VID.alakIntro],
  },
  {
    id: GID.golYaPooch, slug: 'gol-ya-pooch', title: 'گل‌یا‌پوچ',
    description: 'بازی حدس زدن دونفره/گروهی با یک شیء کوچک.',
    thumbnail: null, category: null, difficulty: null,
    categoryConfig: CAT.mind, difficultyConfig: DIFF.easy,
    featured: false, viewCount: 0, videoIds: [VID.golIntro],
  },
  {
    id: GID.lakkoDori, slug: 'lakko-dori', title: 'لک‌و‌دوری',
    description: 'بازی محلی با چوب و حلقه و دقت بالا.',
    thumbnail: null, category: null, difficulty: null,
    categoryConfig: CAT.skill, difficultyConfig: DIFF.medium,
    featured: true, viewCount: 0, videoIds: [VID.lakkoIntro],
  },
  {
    id: GID.gorgomBazi, slug: 'gorgom-be-hava', title: 'گرگم‌به‌هوا',
    description: 'بازی پرتحرک دونده و گریز برای جمع‌های بزرگ.',
    thumbnail: null, category: null, difficulty: null,
    categoryConfig: CAT.active, difficultyConfig: DIFF.easy,
    featured: false, viewCount: 0, videoIds: [VID.gorgomIntro],
  },
  {
    id: GID.yegholeDoghol, slug: 'yeghol-doghol', title: 'یه‌قل‌دوقل',
    description: 'بازی مهارتی با پنج سنگ‌ریزه و هماهنگی دست.',
    thumbnail: null, category: null, difficulty: null,
    categoryConfig: CAT.skill, difficultyConfig: DIFF.hard,
    featured: false, viewCount: 0, videoIds: [VID.yegholIntro],
  },
  {
    id: GID.zooBaazi, slug: 'zoo', title: 'زو',
    description: 'بازی نفس‌گیر گروهی پرهیجان.',
    thumbnail: null, category: null, difficulty: null,
    categoryConfig: CAT.group, difficultyConfig: DIFF.medium,
    featured: true, viewCount: 0, videoIds: [VID.zooIntro],
  },
  {
    id: GID.tabBazi, slug: 'tab-bazi', title: 'تب‌بازی',
    description: 'بازی تعادل و سرعت برای دو نفر.',
    thumbnail: null, category: null, difficulty: null,
    categoryConfig: CAT.active, difficultyConfig: DIFF.easy,
    featured: false, viewCount: 0, videoIds: [VID.tabIntro],
  },
];

const gameById = (id) => games.find((g) => g.id === id);
const gameBySlugOrId = (s) => games.find((g) => g.id === s || g.slug === s);

/** Build the public video object (drops internal `premium` flag). */
function publicVideo(v) {
  if (!v) return null;
  const { premium, ...rest } = v;
  return rest;
}

/** Build the public game object with its embedded videos. */
function publicGame(g) {
  return {
    id: g.id,
    slug: g.slug,
    title: g.title,
    description: g.description,
    thumbnail: g.thumbnail,
    category: g.category,
    difficulty: g.difficulty,
    categoryConfig: g.categoryConfig,
    difficultyConfig: g.difficultyConfig,
    featured: g.featured,
    viewCount: g.viewCount,
    videos: g.videoIds.map((id) => publicVideo(videos.get(id))),
  };
}

// ---------------------------------------------------------------------------
// Tokens (opaque base64url JSON — fine for a mock)
// ---------------------------------------------------------------------------

function makeToken(uid, type, ttlSec) {
  const payload = { uid, type, exp: Date.now() + ttlSec * 1000, jti: uuid() };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function parseToken(token, expectedType) {
  try {
    const p = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
    if (p.type !== expectedType) return null;
    if (typeof p.exp !== 'number' || p.exp < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}

/**
 * Resolve the authenticated user from the Authorization header.
 * Requires EXACTLY `Bearer <token>` (a single space between the scheme and the
 * token), matching the real backend's header parsing.
 */
function getAuthUser(req) {
  const header = req.headers['authorization'];
  if (!header || typeof header !== 'string') return null;
  const match = /^Bearer (.+)$/.exec(header); // single space required
  if (!match) return null;
  const payload = parseToken(match[1], 'access');
  if (!payload) return null;
  return users.get(payload.uid) || null;
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function send(res, status, body) {
  const json = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(json);
}

/** NestJS-style error envelope: { statusCode, message, error }. */
function fail(res, status, message) {
  send(res, status, { statusCode: status, message, error: message });
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 5 * 1024 * 1024) req.destroy(); // 5MB guard
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({ __raw: data });
      }
    });
    req.on('error', () => resolve({}));
  });
}

function publicUser(u) {
  return {
    id: u.id,
    phoneNumber: u.phoneNumber,
    avatar: u.avatar,
    role: u.role,
    isSubscribed: u.isSubscribed,
    subscriptionExpiresAt: u.subscriptionExpiresAt,
    displayName: u.displayName,
  };
}

function ensureUserCollections(uid) {
  if (!favorites.has(uid)) favorites.set(uid, new Set([GID.haftSang]));
  if (!wishlist.has(uid)) wishlist.set(uid, new Set([GID.golYaPooch, GID.zooBaazi]));
  if (!watchHistory.has(uid)) {
    // Seed a little watch history so "continue watching" is non-empty on first login.
    const now = Date.now();
    watchHistory.set(
      uid,
      new Map([
        [VID.haftSangIntro, { videoId: VID.haftSangIntro, progress: 140, updatedAt: new Date(now - 3600_000).toISOString() }],
        [VID.golIntro, { videoId: VID.golIntro, progress: 60, updatedAt: new Date(now - 7200_000).toISOString() }],
      ])
    );
  }
  if (!tokenBalances.has(uid)) tokenBalances.set(uid, 120);
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async function handle(req, res, method, path, query) {
  // ----- Auth -----
  if (method === 'POST' && path === '/auth/send-otp') {
    const body = await readBody(req);
    const phone = String(body.phoneNumber || '').trim();
    if (!PHONE_RE.test(phone)) {
      return fail(res, 400, 'شماره موبایل باید با فرمت 09xxxxxxxxx باشد');
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    otps.set(phone, { otp, expiresAt: Date.now() + OTP_TTL * 1000, attempts: 0 });
    // eslint-disable-next-line no-console
    console.log(`📱 OTP for ${phone}: ${otp}`);
    return send(res, 201, {
      message: 'کد یک‌بارمصرف ارسال شد',
      phoneNumber: phone,
      expiresIn: OTP_TTL,
      otp, // dev only — returned so you can test without SMS
    });
  }

  if (method === 'POST' && path === '/auth/verify-otp') {
    const body = await readBody(req);
    const phone = String(body.phoneNumber || '').trim();
    const otp = String(body.otp || '').trim();
    const record = otps.get(phone);
    if (!record || record.expiresAt < Date.now()) {
      return fail(res, 400, 'کد منقضی شده است. دوباره درخواست دهید');
    }
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      otps.delete(phone);
      return fail(res, 400, 'تعداد تلاش‌ها بیش از حد مجاز است');
    }
    if (record.otp !== otp) {
      record.attempts += 1;
      return fail(res, 400, 'کد واردشده نادرست است');
    }
    otps.delete(phone);

    let userId = usersByPhone.get(phone);
    if (!userId) {
      userId = uuid();
      usersByPhone.set(phone, userId);
      users.set(userId, {
        id: userId,
        phoneNumber: phone,
        avatar: null,
        role: 'user',
        isSubscribed: false,
        subscriptionExpiresAt: null,
        displayName: null,
      });
    }
    ensureUserCollections(userId);
    const user = users.get(userId);
    return send(res, 201, {
      user: publicUser(user),
      accessToken: makeToken(userId, 'access', ACCESS_TOKEN_TTL),
      refreshToken: makeToken(userId, 'refresh', REFRESH_TOKEN_TTL),
    });
  }

  if (method === 'POST' && path === '/auth/refresh') {
    const body = await readBody(req);
    const payload = parseToken(String(body.refreshToken || ''), 'refresh');
    if (!payload || !users.has(payload.uid)) {
      return fail(res, 401, 'refresh token نامعتبر یا منقضی است');
    }
    // IMPORTANT: returns ONLY a new access token (no new refresh token).
    return send(res, 201, {
      accessToken: makeToken(payload.uid, 'access', ACCESS_TOKEN_TTL),
    });
  }

  if (method === 'POST' && path === '/auth/logout') {
    const user = getAuthUser(req);
    if (!user) return fail(res, 401, 'Unauthorized');
    return send(res, 200, { message: 'خروج انجام شد' });
  }

  if (method === 'GET' && path === '/auth/me') {
    const user = getAuthUser(req);
    if (!user) return fail(res, 401, 'Unauthorized');
    return send(res, 200, publicUser(user));
  }

  // ----- Games -----
  if (method === 'GET' && path === '/games/featured') {
    return send(res, 200, games.filter((g) => g.featured).map(publicGame));
  }

  if (method === 'GET' && path === '/games') {
    const page = Math.max(1, Number(query.get('page') || 1));
    const limit = Math.max(1, Number(query.get('limit') || 20));
    const search = String(query.get('search') || '').trim().toLowerCase();
    let filtered = games.map(publicGame);
    if (search) {
      filtered = filtered.filter(
        (g) => g.title.toLowerCase().includes(search) || g.slug.includes(search)
      );
    }
    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return send(res, 200, { data, total, page, limit });
  }

  // POST /games/:id/view  (UUID required)
  let m = /^\/games\/([^/]+)\/view$/.exec(path);
  if (method === 'POST' && m) {
    const id = decodeURIComponent(m[1]);
    if (!UUID_RE.test(id)) {
      return fail(res, 400, 'Validation failed (uuid is expected)');
    }
    const game = gameById(id);
    if (!game) return fail(res, 404, 'بازی یافت نشد');
    game.viewCount += 1;
    return send(res, 201, { viewCount: game.viewCount });
  }

  // GET /games/:slugOrId
  m = /^\/games\/([^/]+)$/.exec(path);
  if (method === 'GET' && m) {
    const game = gameBySlugOrId(decodeURIComponent(m[1]));
    if (!game) return fail(res, 404, 'بازی یافت نشد');
    return send(res, 200, publicGame(game));
  }

  // ----- Videos -----
  m = /^\/videos\/([^/]+)\/validate-access$/.exec(path);
  if (method === 'GET' && m) {
    const user = getAuthUser(req);
    if (!user) return fail(res, 401, 'Unauthorized');
    const v = videos.get(decodeURIComponent(m[1]));
    if (!v) return fail(res, 404, 'ویدیو یافت نشد');
    if (v.premium && !user.isSubscribed) {
      return send(res, 200, {
        hasAccess: false,
        message: 'این ویدیو ویژهٔ کاربران اشتراکی است',
      });
    }
    return send(res, 200, { hasAccess: true, message: 'دسترسی مجاز است' });
  }

  m = /^\/videos\/([^/]+)\/stream$/.exec(path);
  if (method === 'GET' && m) {
    const user = getAuthUser(req);
    if (!user) return fail(res, 401, 'Unauthorized');
    const v = videos.get(decodeURIComponent(m[1]));
    if (!v) return fail(res, 404, 'ویدیو یافت نشد');
    return send(res, 200, {
      url: `https://example.com/streams/${v.id}.m3u8`,
      type: 'hls',
    });
  }

  m = /^\/videos\/([^/]+)$/.exec(path);
  if (method === 'GET' && m) {
    const v = videos.get(decodeURIComponent(m[1]));
    if (!v) return fail(res, 404, 'ویدیو یافت نشد');
    return send(res, 200, publicVideo(v));
  }

  // ----- Favorites -----
  if (method === 'GET' && path === '/favorites') {
    const user = getAuthUser(req);
    if (!user) return fail(res, 401, 'Unauthorized');
    const set = favorites.get(user.id) || new Set();
    return send(res, 200, games.filter((g) => set.has(g.id)).map(publicGame));
  }

  if (method === 'GET' && path === '/favorites/wishlist') {
    const user = getAuthUser(req);
    if (!user) return fail(res, 401, 'Unauthorized');
    const set = wishlist.get(user.id) || new Set();
    return send(res, 200, games.filter((g) => set.has(g.id)).map(publicGame));
  }

  m = /^\/favorites\/([^/]+)\/check$/.exec(path);
  if (method === 'GET' && m) {
    const user = getAuthUser(req);
    if (!user) return fail(res, 401, 'Unauthorized');
    const set = favorites.get(user.id) || new Set();
    return send(res, 200, { isFavorite: set.has(decodeURIComponent(m[1])) });
  }

  m = /^\/favorites\/([^/]+)$/.exec(path);
  if (m && (method === 'POST' || method === 'DELETE')) {
    const user = getAuthUser(req);
    if (!user) return fail(res, 401, 'Unauthorized');
    const gameId = decodeURIComponent(m[1]);
    if (!gameById(gameId)) return fail(res, 404, 'بازی یافت نشد');
    const set = favorites.get(user.id) || new Set();
    if (method === 'POST') set.add(gameId);
    else set.delete(gameId);
    favorites.set(user.id, set);
    return send(res, method === 'POST' ? 201 : 200, { isFavorite: set.has(gameId) });
  }

  // ----- Watch history -----
  if (method === 'GET' && path === '/watch-history') {
    const user = getAuthUser(req);
    if (!user) return fail(res, 401, 'Unauthorized');
    const map = watchHistory.get(user.id) || new Map();
    const items = [...map.values()]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((it) => ({ ...it, video: publicVideo(videos.get(it.videoId)) }));
    return send(res, 200, items);
  }

  m = /^\/watch-history\/([^/]+)$/.exec(path);
  if (method === 'POST' && m) {
    const user = getAuthUser(req);
    if (!user) return fail(res, 401, 'Unauthorized');
    const videoId = decodeURIComponent(m[1]);
    if (!videos.has(videoId)) return fail(res, 404, 'ویدیو یافت نشد');
    const body = await readBody(req);
    const progress = Number(body.progress || 0);
    const map = watchHistory.get(user.id) || new Map();
    const item = { videoId, progress, updatedAt: new Date().toISOString() };
    map.set(videoId, item);
    watchHistory.set(user.id, map);
    return send(res, 201, { ...item, video: publicVideo(videos.get(videoId)) });
  }

  // ----- Users -----
  if (method === 'PATCH' && path === '/users/me') {
    const user = getAuthUser(req);
    if (!user) return fail(res, 401, 'Unauthorized');
    const body = await readBody(req);
    if (typeof body.displayName === 'string') user.displayName = body.displayName;
    if (typeof body.avatar === 'string' || body.avatar === null) user.avatar = body.avatar;
    return send(res, 200, publicUser(user));
  }

  if (method === 'POST' && path === '/users/me/avatar') {
    const user = getAuthUser(req);
    if (!user) return fail(res, 401, 'Unauthorized');
    await readBody(req); // multipart body is ignored by the mock
    user.avatar = `https://example.com/avatars/${user.id}.png`;
    return send(res, 201, publicUser(user));
  }

  if (method === 'GET' && path === '/users/me/token-balance') {
    const user = getAuthUser(req);
    if (!user) return fail(res, 401, 'Unauthorized');
    return send(res, 200, { balance: tokenBalances.get(user.id) ?? 0 });
  }

  if (method === 'GET' && path === '/users/me/subscription-status') {
    const user = getAuthUser(req);
    if (!user) return fail(res, 401, 'Unauthorized');
    return send(res, 200, {
      isSubscribed: user.isSubscribed,
      expiresAt: user.subscriptionExpiresAt,
    });
  }

  m = /^\/users\/([^/]+)$/.exec(path);
  if (method === 'GET' && m) {
    const target = users.get(decodeURIComponent(m[1]));
    if (!target) return fail(res, 404, 'کاربر یافت نشد');
    return send(res, 200, publicUser(target));
  }

  // ----- Health -----
  if (method === 'GET' && (path === '/' || path === '/health')) {
    return send(res, 200, { status: 'ok', service: 'jamjoys-mock-backend' });
  }

  return fail(res, 404, `مسیر یافت نشد: ${method} ${path}`);
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, undefined);
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  handle(req, res, req.method, path, url.searchParams).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Unhandled error:', err);
    fail(res, 500, 'خطای داخلی سرور');
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`\n🎲 JamJoys mock backend running at http://localhost:${PORT}`);
  console.log(`   Access-token TTL: ${ACCESS_TOKEN_TTL}s  |  Refresh-token TTL: ${REFRESH_TOKEN_TTL}s`);
  console.log('   Sign in with any 09xxxxxxxxx number; the OTP is printed above and in the response body.\n');
});
