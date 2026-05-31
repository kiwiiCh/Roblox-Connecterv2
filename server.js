import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const CLIENT_ID     = process.env.ROBLOX_CLIENT_ID;
const CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET;
const REDIRECT_URI  = process.env.REDIRECT_URI || 'http://localhost:3000/api/auth/callback';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-in-production';

app.use(express.json());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

// ── 1. Return the OAuth URL for the frontend to redirect to ──────────────────
app.get('/api/auth/url', (req, res) => {
  if (!CLIENT_ID) return res.status(500).json({ error: 'ROBLOX_CLIENT_ID not set' });
  const state = Math.random().toString(36).substring(2, 18);
  req.session.oauthState = state;
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'openid profile',
    response_type: 'code',
    state,
  });
  res.json({ url: `https://apis.roblox.com/oauth/v1/authorize?${params}` });
});

// ── 2. Roblox redirects here after the user approves ────────────────────────
app.get('/api/auth/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) return res.redirect(`/?error=${error}`);
  if (!code)  return res.redirect('/?error=no_code');
  if (state !== req.session.oauthState) return res.redirect('/?error=invalid_state');

  try {
    // Exchange code → access token
    const tokenRes = await fetch('https://apis.roblox.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  REDIRECT_URI,
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error(JSON.stringify(tokenData));

    // Fetch user info from Roblox
    const userRes = await fetch('https://apis.roblox.com/oauth/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const user = await userRes.json();

    // Fetch extra profile info (headshot thumbnail)
    const userId = user.sub;
    const thumbRes = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`
    );
    const thumbData = await thumbRes.json();
    const avatar = thumbData?.data?.[0]?.imageUrl || null;

    req.session.user = { ...user, avatar };
    req.session.accessToken = tokenData.access_token;
    delete req.session.oauthState;

    res.redirect('/');
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect('/?error=auth_failed');
  }
});

// ── 3. Who am I? ─────────────────────────────────────────────────────────────
app.get('/api/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  res.json(req.session.user);
});

// ── 4. Friends list + presence + avatars ─────────────────────────────────────
app.get('/api/friends', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

  const userId = req.session.user.sub;
  const token  = req.session.accessToken;

  try {
    // Friends list (public API)
    const friendsRes = await fetch(
      `https://friends.roblox.com/v1/users/${userId}/friends?userSort=Alphabetical`
    );
    const friendsData = await friendsRes.json();
    const friends = friendsData.data || [];

    if (friends.length === 0) return res.json([]);

    const userIds = friends.map(f => f.id);

    // Presence (try with OAuth Bearer — gracefully degrade if it fails)
    let presences = [];
    try {
      const presRes = await fetch('https://presence.roblox.com/v1/presence/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds }),
      });
      const presData = await presRes.json();
      presences = presData.userPresences || [];
    } catch (e) {
      console.warn('Presence API unavailable, falling back to offline status');
    }

    // Avatar thumbnails (public)
    let thumbs = [];
    try {
      const tRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userIds.join(',')}&size=150x150&format=Png&isCircular=false`
      );
      const tData = await tRes.json();
      thumbs = tData.data || [];
    } catch (e) {
      console.warn('Thumbnails API unavailable');
    }

    // Merge everything
    const merged = friends.map(f => {
      const presence = presences.find(p => p.userId === f.id) || {};
      const thumb    = thumbs.find(t => t.targetId === f.id)  || {};

      // userPresenceType: 0=offline, 1=online, 2=in-game, 3=in-studio
      const statusMap = { 0: 'offline', 1: 'online', 2: 'ingame', 3: 'online' };
      const status = statusMap[presence.userPresenceType] ?? 'offline';

      return {
        id:          f.id,
        username:    f.name,
        displayName: f.displayName,
        avatar:      thumb.imageUrl || null,
        status,
        game:        presence.lastLocation || null,
        placeId:     presence.placeId      || null,
        gameId:      presence.gameId       || null,
      };
    });

    // Sort: in-game first, then online, then offline
    const order = { ingame: 0, online: 1, offline: 2 };
    merged.sort((a, b) => order[a.status] - order[b.status]);

    res.json(merged);
  } catch (err) {
    console.error('Friends error:', err);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// ── 5. Logout ─────────────────────────────────────────────────────────────────
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

// ── Serve built frontend in production ────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Roblox Connecter running on port ${PORT}`));
