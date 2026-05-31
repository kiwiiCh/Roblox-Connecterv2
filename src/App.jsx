import { useState, useEffect, useCallback } from "react";
import { Home, Users, LogOut, Search, Gamepad2, ExternalLink, X, ChevronRight, RefreshCw } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_LABEL = { ingame: "In Game", online: "Online", offline: "Offline" };
const STATUS_COLOR = { ingame: "#22c55e", online: "#3b82f6", offline: "#6b7280" };
const AVATAR_BG    = [
  ["#E8000B","#ff4444"],["#0055FF","#4488ff"],["#00A550","#33dd88"],
  ["#FF6B00","#ffaa44"],["#9B27B0","#cc66ff"],["#E91E8C","#ff66cc"],
  ["#00BCD4","#44eeff"],["#FF5722","#ff8855"],["#607D8B","#90aabb"],
  ["#8B4513","#cc8855"],["#006400","#44aa44"],["#4B0082","#9955ff"],
];
const getAvatarBg = id => AVATAR_BG[id % AVATAR_BG.length];

// ─── Roblox R logo ────────────────────────────────────────────────────────────
function RobloxLogo({ size = 60, spinning = false }) {
  return (
    <div style={{ width:size, height:size, flexShrink:0,
      animation: spinning ? "rbxSpin 0.9s linear infinite" : "none",
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
          <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff3322"/>
            <stop offset="100%" stopColor="#cc0008"/>
          </linearGradient>
        </defs>
        <rect x="10" y="10" width="80" height="80" rx="10" fill="url(#rg)" transform="rotate(-10 50 50)"/>
        <text x="51" y="72" textAnchor="middle" fill="white" fontSize="62" fontWeight="900"
          fontFamily="Arial Black, Arial, sans-serif">R</text>
      </svg>
    </div>
  );
}

// ─── Avatar (image or fallback letter) ───────────────────────────────────────
function Avatar({ player, size = 56 }) {
  const [imgOk, setImgOk] = useState(!!player?.avatar);
  const [c1, c2] = getAvatarBg(player?.id || 0);
  const letter = (player?.displayName || player?.username || "?")[0].toUpperCase();

  useEffect(() => { setImgOk(!!player?.avatar); }, [player?.avatar]);

  if (imgOk && player?.avatar) {
    return (
      <img
        src={player.avatar}
        onError={() => setImgOk(false)}
        style={{ width:size, height:size, borderRadius:size*0.2,
          objectFit:"cover", flexShrink:0,
          border:"2px solid rgba(255,255,255,0.1)" }}
        alt={player.displayName}
      />
    );
  }

  return (
    <div style={{
      width:size, height:size, borderRadius:size*0.2, flexShrink:0,
      background:`linear-gradient(135deg, ${c1}, ${c2})`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.42, fontWeight:900, color:"#fff",
      boxShadow:`0 4px 14px ${c1}44`,
      border:"2px solid rgba(255,255,255,0.1)",
      position:"relative",
    }}>
      {letter}
    </div>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen({ message = "Connecting to Roblox…" }) {
  return (
    <div className="loading-screen">
      <div className="loading-glow"/>
      <RobloxLogo size={96} spinning/>
      <div className="loading-title">ROBLOX CONNECTER</div>
      <div className="loading-sub">{message}</div>
      <div className="loading-dots"><span/><span/><span/></div>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, error }) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/url');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      window.location.href = data.url;
    } catch (e) {
      alert("Could not reach the server. Make sure ROBLOX_CLIENT_ID is set in Render environment variables.");
      setLoading(false);
    }
  };

  const ERROR_MSG = {
    auth_failed:   "Authentication failed. Please try again.",
    invalid_state: "Security check failed. Please try again.",
    no_code:       "Roblox didn't return an auth code. Please try again.",
  };

  return (
    <div className="login-screen">
      <div className="login-bg-circle c1"/>
      <div className="login-bg-circle c2"/>
      <div className="login-card">
        <RobloxLogo size={80}/>
        <div className="login-brand">ROBLOX CONNECTER</div>
        <p className="login-tagline">
          Track your friends, see what they're playing, and jump into any game — all in one place.
        </p>

        {error && (
          <div className="error-banner">
            ⚠️ {ERROR_MSG[error] || "An error occurred. Please try again."}
          </div>
        )}

        <button className="oauth-btn" onClick={handleLogin} disabled={loading}>
          {loading ? (
            <><div className="spin-small"/> Redirecting to Roblox…</>
          ) : (
            <><svg width="20" height="20" viewBox="0 0 100 100">
              <rect x="10" y="10" width="80" height="80" rx="10" fill="white" transform="rotate(-10 50 50)"/>
              <text x="51" y="72" textAnchor="middle" fill="#E8000B" fontSize="62" fontWeight="900" fontFamily="Arial Black, sans-serif">R</text>
            </svg> Continue with Roblox</>
          )}
        </button>

        <div className="oauth-badge">
          <div className="badge-dot"/>
          <span>Powered by Roblox OAuth 2.0 — we never see your password</span>
        </div>
      </div>
    </div>
  );
}

// ─── Player Card ──────────────────────────────────────────────────────────────
function PlayerCard({ player, delay = 0 }) {
  const sc = STATUS_COLOR[player.status];

  const handleJoin = () => {
    const rbxUrl = `roblox://placeId=${player.placeId}${player.gameId ? `&gameInstanceId=${player.gameId}` : ""}`;
    window.location.href = rbxUrl;
    setTimeout(() => {
      window.open(`https://www.roblox.com/games/${player.placeId}`, "_blank");
    }, 900);
  };

  return (
    <div className="player-card" style={{ animationDelay:`${delay}ms` }}>
      <div className="card-top">
        <div style={{ position:"relative", alignSelf:"center" }}>
          <Avatar player={player} size={68}/>
          <div className="card-status-dot" style={{ background:sc, boxShadow:`0 0 8px ${sc}` }}/>
        </div>
        <div className="card-info">
          <div className="card-display">{player.displayName}</div>
          <div className="card-user">@{player.username}</div>
          <div className="card-status-row" style={{ color:sc }}>
            <div className="card-status-pip" style={{ background:sc }}/>
            {STATUS_LABEL[player.status]}
          </div>
          {player.game && (
            <div className="card-game-tag">
              <Gamepad2 size={11}/>
              <span>{player.game}</span>
            </div>
          )}
        </div>
      </div>
      {player.status === "ingame" && player.placeId && (
        <button className="card-join-btn" onClick={handleJoin}>
          Join Game <ChevronRight size={13}/>
        </button>
      )}
    </div>
  );
}

// ─── Players Page ─────────────────────────────────────────────────────────────
function PlayersPage({ user }) {
  const [players, setPlayers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);
  const [search,  setSearch]    = useState("");
  const [filter,  setFilter]    = useState("all");

  const loadFriends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/friends');
      if (!res.ok) throw new Error("Failed to load friends");
      const data = await res.json();
      setPlayers(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFriends(); }, [loadFriends]);

  const counts = {
    ingame:  players.filter(p => p.status === "ingame").length,
    online:  players.filter(p => p.status === "online").length,
    offline: players.filter(p => p.status === "offline").length,
  };

  const FILTERS = [
    { key:"all",    label:"All",     count:players.length },
    { key:"ingame", label:"In Game", count:counts.ingame },
    { key:"online", label:"Online",  count:counts.online },
    { key:"offline",label:"Offline", count:counts.offline },
  ];

  const filtered = players.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      p.username.toLowerCase().includes(q) ||
      p.displayName.toLowerCase().includes(q) ||
      (p.game || "").toLowerCase().includes(q);
    const matchFilter = filter === "all" || p.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
          <h2 className="page-title">Friends</h2>
          <button className="refresh-btn" onClick={loadFriends} disabled={loading}>
            <RefreshCw size={14} style={{ animation: loading ? "rbxSpin 0.9s linear infinite" : "none" }}/>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
        <div className="page-stats">
          <span className="pstat green"><span className="pstat-dot" style={{background:"#22c55e"}}/>{counts.ingame} In Game</span>
          <span className="pstat blue"><span className="pstat-dot" style={{background:"#3b82f6"}}/>{counts.online} Online</span>
          <span className="pstat grey"><span className="pstat-dot" style={{background:"#6b7280"}}/>{counts.offline} Offline</span>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <Search size={15} color="#64748b"/>
          <input
            className="search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, username, or game…"
          />
          {search && <button className="clear-search" onClick={() => setSearch("")}><X size={13}/></button>}
        </div>
        <div className="filter-row">
          {FILTERS.map(f => (
            <button key={f.key}
              className={`filter-pill ${filter === f.key ? "active " + f.key : ""}`}
              onClick={() => setFilter(f.key)}>
              {f.label}
              <span className="pill-count">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="empty-state">
          <div className="spin-lg"/>
          <div style={{color:"#64748b"}}>Loading your friends…</div>
        </div>
      )}

      {!loading && error && (
        <div className="error-state">
          <div>⚠️ {error}</div>
          <button className="retry-btn" onClick={loadFriends}>Try again</button>
        </div>
      )}

      {!loading && !error && players.length === 0 && (
        <div className="empty-state">
          <Users size={36} color="#334155"/>
          <div style={{color:"#64748b", textAlign:"center"}}>
            No friends found.<br/>
            <span style={{fontSize:13}}>Make sure your friends list is set to <strong style={{color:"#fff"}}>Public</strong> on Roblox.</span>
          </div>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && players.length > 0 && (
        <div className="empty-state">
          <Search size={36} color="#334155"/>
          <div>No results for "<strong style={{color:"#E8000B"}}>{search}</strong>"</div>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="cards-grid">
          {filtered.map((p, i) => <PlayerCard key={p.id} player={p} delay={i * 35}/>)}
        </div>
      )}
    </div>
  );
}

// ─── Join Page ────────────────────────────────────────────────────────────────
function JoinPage() {
  const [placeId,  setPlaceId]  = useState("");
  const [serverId, setServerId] = useState("");
  const [status,   setStatus]   = useState(null);

  const handleJoin = () => {
    if (!placeId.trim()) return;
    setStatus("launching");
    let url = `roblox://placeId=${placeId.trim()}`;
    if (serverId.trim()) url += `&gameInstanceId=${serverId.trim()}`;
    window.location.href = url;
    setTimeout(() => setStatus("done"), 1600);
  };

  const deepLink = placeId.trim()
    ? `roblox://placeId=${placeId.trim()}${serverId.trim() ? `&gameInstanceId=${serverId.trim()}` : ""}`
    : null;

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Join Game</h2>
        <p className="page-desc">Paste a Place ID or Server ID to jump straight into any Roblox game.</p>
      </div>

      <div className="join-card">
        <div className="join-field">
          <label className="field-label">Place ID <span style={{color:"#E8000B"}}>*</span></label>
          <input className={`join-input ${placeId ? "has-value" : ""}`} value={placeId}
            onChange={e => setPlaceId(e.target.value.replace(/\D/g,""))}
            placeholder="e.g. 12943245078"/>
          <span className="field-hint">The number in the game URL: roblox.com/games/<strong>ID</strong>/…</span>
        </div>

        <div className="join-field">
          <label className="field-label">Server ID <span className="opt-label">(optional)</span></label>
          <input className={`join-input ${serverId ? "has-value" : ""}`} value={serverId}
            onChange={e => setServerId(e.target.value)}
            placeholder="e.g. a1b2c3d4-e5f6-7890-abcd-ef1234567890"/>
          <span className="field-hint">For private servers — leave blank for any open server</span>
        </div>

        {deepLink && (
          <div className="link-preview">
            <div className="link-label">Deep link</div>
            <code className="link-code">{deepLink}</code>
          </div>
        )}

        <button className={`join-btn-main ${!placeId.trim()?"disabled":""} ${status==="launching"?"launching":""} ${status==="done"?"done":""}`}
          onClick={handleJoin} disabled={!placeId.trim()}>
          {status==="launching" ? <><div className="spin-small"/>Launching Roblox…</> :
           status==="done"      ? <>✓ Roblox Launched!</> :
                                  <>Join Game <ExternalLink size={15}/></>}
        </button>

        {status === "done" && (
          <p className="launch-note">If Roblox didn't open automatically, make sure the Roblox app is installed.</p>
        )}
      </div>

      <div className="howto-card">
        <div className="howto-title">How to find a Place ID</div>
        <div className="howto-steps">
          <div className="howto-step"><span className="step-num">1</span><span>Go to any game on roblox.com</span></div>
          <div className="howto-step"><span className="step-num">2</span><span>Look at the URL: <code>roblox.com/games/<strong style={{color:"#E8000B"}}>PLACE_ID</strong>/name</code></span></div>
          <div className="howto-step"><span className="step-num">3</span><span>Copy that number and paste it above, then click Join</span></div>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, user, onLogout }) {
  const NAV = [
    { key:"players", label:"Friends",   Icon:Users },
    { key:"join",    label:"Join Game", Icon:Home  },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <RobloxLogo size={34}/>
        <div>
          <div className="brand-name">CONNECTER</div>
          <div className="brand-sub">for Roblox</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ key, label, Icon }) => (
          <button key={key}
            className={`nav-btn ${page===key?"active":""}`}
            onClick={() => setPage(key)}>
            <Icon size={18}/>
            <span>{label}</span>
            {page===key && <div className="nav-indicator"/>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div style={{ position:"relative" }}>
            <Avatar player={{ id:parseInt(user.sub||0), username:user.preferred_username, displayName:user.name, avatar:user.avatar }} size={36}/>
            <div className="user-online-dot"/>
          </div>
          <div className="user-info">
            <div className="user-name">{user.name || user.preferred_username}</div>
            <div className="user-sub">@{user.preferred_username}</div>
          </div>
          <button className="logout-btn" onClick={onLogout} title="Sign out"><LogOut size={15}/></button>
        </div>
      </div>
    </aside>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [appState, setAppState] = useState("loading"); // loading | login | app
  const [user,     setUser]     = useState(null);
  const [page,     setPage]     = useState("players");
  const [urlError, setUrlError] = useState(null);

  useEffect(() => {
    // Check for error param from OAuth callback
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      setUrlError(err);
      window.history.replaceState({}, "", "/");
    }

    // Check if already logged in
    fetch('/api/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.sub) {
          setUser(data);
          setAppState("app");
        } else {
          setAppState("login");
        }
      })
      .catch(() => setAppState("login"));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method:"POST" });
    setUser(null);
    setAppState("login");
  };

  return (
    <>
      <style>{CSS}</style>
      {appState === "loading" && <LoadingScreen/>}
      {appState === "login"   && <LoginScreen onLogin={() => {}} error={urlError}/>}
      {appState === "app"     && user && (
        <div className="app-layout">
          <Sidebar page={page} setPage={setPage} user={user} onLogout={handleLogout}/>
          <main className="app-main">
            {page === "players" ? <PlayersPage user={user}/> : <JoinPage/>}
          </main>
        </div>
      )}
    </>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body,#root{height:100vh;overflow:hidden;font-family:'Outfit',sans-serif;background:#0c0c14;}

@keyframes rbxSpin   {to{transform:rotate(360deg);}}
@keyframes fadeUp    {from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}
@keyframes dotBounce {0%,80%,100%{transform:scale(0.4);opacity:0.3;}40%{transform:scale(1);opacity:1;}}
@keyframes glowPulse {0%,100%{opacity:0.4;transform:scale(1);}50%{opacity:0.7;transform:scale(1.08);}}
@keyframes cardSlide {from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
@keyframes slidePage {from{opacity:0;transform:translateX(10px);}to{opacity:1;transform:translateX(0);}}

/* Loading */
.loading-screen{position:fixed;inset:0;background:radial-gradient(ellipse at 50% 60%,#210008 0%,#0c0c14 65%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;z-index:9999;}
.loading-glow{position:absolute;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle,#E8000B22 0%,transparent 70%);animation:glowPulse 2.4s ease-in-out infinite;}
.loading-title{color:#fff;font-size:20px;font-weight:900;letter-spacing:5px;animation:fadeUp 0.5s ease 0.3s both;}
.loading-sub{color:#64748b;font-size:13px;animation:fadeUp 0.5s ease 0.5s both;}
.loading-dots{display:flex;gap:8px;animation:fadeUp 0.5s ease 0.6s both;}
.loading-dots span{width:8px;height:8px;border-radius:50%;background:#E8000B;animation:dotBounce 1.4s ease-in-out infinite;}
.loading-dots span:nth-child(2){animation-delay:.18s;}
.loading-dots span:nth-child(3){animation-delay:.36s;}

/* Login */
.login-screen{height:100vh;background:radial-gradient(ellipse at 30% 70%,#1e0007 0%,#0c0c14 60%);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}
.login-bg-circle{position:absolute;border-radius:50%;background:radial-gradient(circle,#E8000B18 0%,transparent 70%);pointer-events:none;}
.login-bg-circle.c1{width:500px;height:500px;top:-100px;right:-150px;animation:glowPulse 3s ease-in-out infinite;}
.login-bg-circle.c2{width:300px;height:300px;bottom:-60px;left:-80px;animation:glowPulse 3.6s 1s ease-in-out infinite;}
.login-card{position:relative;z-index:1;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:22px;padding:44px 40px;max-width:400px;width:92%;display:flex;flex-direction:column;align-items:center;gap:16px;animation:fadeUp 0.5s ease;backdrop-filter:blur(20px);}
.login-brand{color:#fff;font-size:18px;font-weight:900;letter-spacing:4px;}
.login-tagline{color:#64748b;font-size:13.5px;text-align:center;line-height:1.7;}
.error-banner{background:rgba(232,0,11,0.1);border:1px solid rgba(232,0,11,0.3);border-radius:10px;padding:10px 14px;color:#ff6666;font-size:13px;width:100%;text-align:center;}
.oauth-btn{display:flex;align-items:center;gap:10px;justify-content:center;background:#E8000B;color:#fff;border:none;border-radius:12px;padding:15px 28px;font-size:15px;font-weight:800;cursor:pointer;width:100%;font-family:'Outfit',sans-serif;transition:background 0.18s,transform 0.12s,box-shadow 0.18s;box-shadow:0 4px 20px #E8000B55;}
.oauth-btn:hover:not(:disabled){background:#c5000a;transform:translateY(-2px);box-shadow:0 6px 28px #E8000B77;}
.oauth-btn:disabled{opacity:0.7;cursor:not-allowed;}
.oauth-badge{display:flex;align-items:center;gap:7px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:20px;padding:5px 12px;}
.badge-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;flex-shrink:0;}
.oauth-badge span{color:#94a3b8;font-size:11.5px;}

/* App layout */
.app-layout{display:flex;height:100vh;background:#0c0c14;overflow:hidden;}

/* Sidebar */
.sidebar{width:224px;flex-shrink:0;background:#0f0f1c;border-right:1px solid rgba(255,255,255,0.05);display:flex;flex-direction:column;}
.sidebar-brand{display:flex;align-items:center;gap:10px;padding:18px 16px 16px;border-bottom:1px solid rgba(255,255,255,0.05);}
.brand-name{color:#fff;font-size:12px;font-weight:900;letter-spacing:2.5px;}
.brand-sub{color:#64748b;font-size:10px;font-weight:600;letter-spacing:1px;margin-top:1px;}
.sidebar-nav{flex:1;padding:12px 10px;display:flex;flex-direction:column;gap:3px;}
.nav-btn{display:flex;align-items:center;gap:11px;padding:11px 14px;border-radius:10px;background:none;border:none;color:#64748b;font-size:14px;font-weight:700;cursor:pointer;width:100%;text-align:left;position:relative;transition:all 0.15s;font-family:'Outfit',sans-serif;}
.nav-btn:hover{background:rgba(255,255,255,0.05);color:#cbd5e1;}
.nav-btn.active{background:rgba(232,0,11,0.12);color:#E8000B;}
.nav-indicator{position:absolute;right:10px;width:5px;height:5px;border-radius:50%;background:#E8000B;}
.sidebar-footer{border-top:1px solid rgba(255,255,255,0.05);padding:12px;}
.sidebar-user{display:flex;align-items:center;gap:10px;}
.user-online-dot{position:absolute;bottom:1px;right:1px;width:10px;height:10px;border-radius:50%;background:#22c55e;border:2px solid #0f0f1c;}
.user-info{flex:1;overflow:hidden;}
.user-name{color:#fff;font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.user-sub{color:#64748b;font-size:11px;}
.logout-btn{background:none;border:none;color:#64748b;cursor:pointer;padding:5px;border-radius:7px;transition:all 0.15s;flex-shrink:0;}
.logout-btn:hover{color:#E8000B;background:rgba(232,0,11,0.1);}

/* Main */
.app-main{flex:1;overflow-y:auto;padding:28px 30px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.08) transparent;}
.app-main::-webkit-scrollbar{width:5px;}
.app-main::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px;}

/* Page */
.page{animation:slidePage 0.25s ease;max-width:1100px;}
.page-header{margin-bottom:22px;}
.page-title{color:#fff;font-size:24px;font-weight:900;margin-bottom:6px;}
.page-desc{color:#64748b;font-size:13.5px;}
.page-stats{display:flex;gap:14px;margin-top:8px;flex-wrap:wrap;}
.pstat{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;padding:4px 11px;border-radius:20px;}
.pstat.green{background:rgba(34,197,94,0.1);color:#22c55e;border:1px solid rgba(34,197,94,0.2);}
.pstat.blue{background:rgba(59,130,246,0.1);color:#3b82f6;border:1px solid rgba(59,130,246,0.2);}
.pstat.grey{background:rgba(107,114,128,0.1);color:#9ca3af;border:1px solid rgba(107,114,128,0.2);}
.pstat-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}

/* Toolbar */
.toolbar{display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;align-items:center;}
.search-wrap{display:flex;align-items:center;gap:9px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:9px 13px;flex:1;min-width:200px;transition:border-color 0.15s;}
.search-wrap:focus-within{border-color:rgba(232,0,11,0.4);}
.search-input{background:none;border:none;outline:none;color:#fff;font-size:13.5px;width:100%;font-family:'Outfit',sans-serif;}
.search-input::placeholder{color:#64748b;}
.clear-search{background:none;border:none;color:#64748b;cursor:pointer;padding:0;display:flex;align-items:center;}
.clear-search:hover{color:#fff;}
.filter-row{display:flex;gap:6px;flex-wrap:wrap;}
.filter-pill{display:flex;align-items:center;gap:6px;padding:7px 13px;border-radius:8px;font-size:12px;font-weight:700;border:1px solid rgba(255,255,255,0.08);background:transparent;color:#64748b;cursor:pointer;transition:all 0.15s;font-family:'Outfit',sans-serif;}
.filter-pill:hover{color:#fff;border-color:rgba(255,255,255,0.2);}
.pill-count{background:rgba(255,255,255,0.08);border-radius:10px;padding:1px 7px;font-size:10px;}
.filter-pill.active.all{background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.2);}
.filter-pill.active.ingame{background:rgba(34,197,94,0.15);color:#22c55e;border-color:rgba(34,197,94,0.3);}
.filter-pill.active.online{background:rgba(59,130,246,0.15);color:#3b82f6;border-color:rgba(59,130,246,0.3);}
.filter-pill.active.offline{background:rgba(107,114,128,0.15);color:#9ca3af;border-color:rgba(107,114,128,0.3);}

/* Cards */
.cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px;}
.player-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:12px;animation:cardSlide 0.35s ease both;transition:border-color 0.18s,transform 0.15s,box-shadow 0.15s;}
.player-card:hover{border-color:rgba(255,255,255,0.14);transform:translateY(-3px);box-shadow:0 8px 32px rgba(0,0,0,0.3);}
.card-top{display:flex;gap:12px;align-items:flex-start;}
.card-status-dot{position:absolute;bottom:-2px;right:-2px;width:14px;height:14px;border-radius:50%;border:2.5px solid #0c0c14;}
.card-info{flex:1;display:flex;flex-direction:column;gap:3px;overflow:hidden;}
.card-display{color:#fff;font-size:14px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.card-user{color:#64748b;font-size:11.5px;}
.card-status-row{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;}
.card-status-pip{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
.card-game-tag{display:flex;align-items:center;gap:5px;background:rgba(255,255,255,0.05);border-radius:6px;padding:3px 8px;color:#94a3b8;font-size:11px;margin-top:3px;overflow:hidden;}
.card-game-tag svg{flex-shrink:0;color:#E8000B;}
.card-game-tag span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.card-join-btn{display:flex;align-items:center;justify-content:center;gap:4px;background:linear-gradient(135deg,#E8000B,#c0000a);color:#fff;border:none;border-radius:8px;padding:9px;font-size:12px;font-weight:900;cursor:pointer;width:100%;font-family:'Outfit',sans-serif;letter-spacing:0.5px;transition:opacity 0.15s,transform 0.1s;box-shadow:0 3px 12px #E8000B33;}
.card-join-btn:hover{opacity:0.88;transform:translateY(-1px);}

/* States */
.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:70px 0;color:#475569;font-size:15px;font-weight:600;}
.error-state{display:flex;flex-direction:column;align-items:center;gap:14px;padding:60px 0;color:#ff6666;font-size:14px;}
.retry-btn{background:rgba(232,0,11,0.15);border:1px solid rgba(232,0,11,0.3);color:#E8000B;border-radius:8px;padding:8px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif;}
.retry-btn:hover{background:rgba(232,0,11,0.25);}
.refresh-btn{display:flex;align-items:center;gap:7px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;border-radius:9px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif;transition:all 0.15s;}
.refresh-btn:hover:not(:disabled){color:#fff;border-color:rgba(255,255,255,0.2);}
.refresh-btn:disabled{opacity:0.5;cursor:not-allowed;}

/* Join */
.join-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:26px;max-width:500px;display:flex;flex-direction:column;gap:20px;margin-bottom:20px;}
.join-field{display:flex;flex-direction:column;gap:6px;}
.field-label{color:#fff;font-size:13px;font-weight:800;}
.opt-label{color:#64748b;font-weight:500;font-size:12px;}
.join-input{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:12px 14px;color:#fff;font-size:14px;outline:none;font-family:'Outfit',sans-serif;transition:border-color 0.15s;width:100%;}
.join-input:focus{border-color:#E8000B;}
.join-input.has-value{border-color:rgba(232,0,11,0.35);}
.join-input::placeholder{color:#64748b;}
.field-hint{color:#64748b;font-size:12px;}
.link-preview{background:rgba(232,0,11,0.07);border:1px solid rgba(232,0,11,0.2);border-radius:10px;padding:10px 14px;}
.link-label{color:#E8000B;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:5px;}
.link-code{color:#ff6666;font-size:12px;word-break:break-all;display:block;}
.join-btn-main{display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#E8000B,#c0000a);color:#fff;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:900;cursor:pointer;font-family:'Outfit',sans-serif;transition:opacity 0.15s,transform 0.12s,box-shadow 0.15s;box-shadow:0 4px 20px #E8000B44;}
.join-btn-main:hover:not(.disabled){opacity:0.88;transform:translateY(-2px);box-shadow:0 6px 28px #E8000B66;}
.join-btn-main.disabled{opacity:0.35;cursor:not-allowed;box-shadow:none;}
.join-btn-main.launching{background:linear-gradient(135deg,#334155,#1e293b);box-shadow:none;}
.join-btn-main.done{background:linear-gradient(135deg,#166534,#14532d);box-shadow:0 4px 20px #22c55e44;}
.launch-note{color:#94a3b8;font-size:12px;text-align:center;line-height:1.5;}
.howto-card{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:20px;max-width:500px;}
.howto-title{color:#fff;font-size:14px;font-weight:800;margin-bottom:14px;}
.howto-steps{display:flex;flex-direction:column;gap:10px;}
.howto-step{display:flex;align-items:flex-start;gap:12px;color:#94a3b8;font-size:13px;line-height:1.5;}
.step-num{flex-shrink:0;width:22px;height:22px;border-radius:50%;background:rgba(232,0,11,0.15);border:1px solid rgba(232,0,11,0.3);color:#E8000B;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;}
.howto-step code{background:rgba(255,255,255,0.06);border-radius:5px;padding:1px 6px;font-size:12px;color:#cbd5e1;}

/* Spinners */
.spin-small{width:15px;height:15px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:rbxSpin 0.7s linear infinite;flex-shrink:0;}
.spin-lg{width:34px;height:34px;border:3px solid rgba(255,255,255,0.08);border-top-color:#E8000B;border-radius:50%;animation:rbxSpin 0.8s linear infinite;}
`;
