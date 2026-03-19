export default function AuthPreview() {
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuditLog, setShowAuditLog] = useState(false);

  const mockUsers = [
    { id: 1, email: 'admin@lotus.com', role: 'Admin', name: 'สมชาย วงศ์ใหญ่' },
    { id: 2, email: 'ra.manager@lotus.com', role: 'RAManager', name: 'สุภาพ ศรีสุข' },
    { id: 3, email: 'ra.specialist@lotus.com', role: 'RASpecialist', name: 'วิไล จันทร์เพ็ญ' },
    { id: 4, email: 'aw.tech@lotus.com', role: 'AWTechnician', name: 'ประเสริฐ มั่นคง' }
  ];

  const mockAuditLogs = [
    {
      id: 1,
      userId: 3,
      action: 'UserLogin',
      entityType: 'User',
      timestamp: '2024-01-15T09:23:45Z',
      ipAddress: '192.168.1.105',
      details: { email: 'ra.specialist@lotus.com', success: true }
    },
    {
      id: 2,
      userId: 3,
      action: 'DocumentView',
      entityType: 'Document',
      timestamp: '2024-01-15T09:25:12Z',
      ipAddress: '192.168.1.105',
      details: { documentId: 'DOC-2024-001', title: 'PIL Update Request' }
    },
    {
      id: 3,
      userId: 2,
      action: 'UserLogin',
      entityType: 'User',
      timestamp: '2024-01-15T10:15:33Z',
      ipAddress: '192.168.1.88',
      details: { email: 'ra.manager@lotus.com', success: true }
    },
    {
      id: 4,
      userId: null,
      action: 'UserLogin',
      entityType: 'User',
      timestamp: '2024-01-15T11:42:18Z',
      ipAddress: '203.154.89.22',
      details: { email: 'unknown@test.com', success: false, error: 'Invalid credentials' }
    },
    {
      id: 5,
      userId: 3,
      action: 'DocumentUpdate',
      entityType: 'Document',
      timestamp: '2024-01-15T14:08:55Z',
      ipAddress: '192.168.1.105',
      details: { documentId: 'DOC-2024-001', changes: ['status', 'assignee'] }
    }
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const user = mockUsers.find(u => u.email === email);
      if (user && password === 'password123') {
        setCurrentUser(user);
        setView('dashboard');
        setEmail('');
        setPassword('');
      } else {
        setError('Invalid email or password');
      }
      setLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('login');
    setShowAuditLog(false);
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      Admin: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      RAManager: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      RASpecialist: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      AWTechnician: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    };
    return colors[role] || 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
  };

  const getActionBadgeColor = (action) => {
    const colors = {
      UserLogin: 'bg-emerald-500/20 text-emerald-300',
      UserLogout: 'bg-zinc-500/20 text-zinc-300',
      DocumentView: 'bg-cyan-500/20 text-cyan-300',
      DocumentUpdate: 'bg-violet-500/20 text-violet-300',
      DocumentCreate: 'bg-amber-500/20 text-amber-300'
    };
    return colors[action] || 'bg-zinc-500/20 text-zinc-300';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-zinc-800/50 rounded-2xl p-8 border border-white/[0.06] shadow-lg shadow-black/20">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <span className="text-xl">🔐</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">PIL Lens</h1>
                  <p className="text-xs text-zinc-500">Pharmaceutical Intelligence</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400">Sign in to your account</p>
            </div>

            {error && (
              <div className="mb-6 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-rose-400">⚠️</span>
                  <p className="text-sm text-rose-400">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl bg-white/5 border border-white/10 py-3 px-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all"
                  placeholder="you@lotus.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl bg-white/5 border border-white/10 py-3 px-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-violet-500 hover:bg-violet-600 active:bg-violet-700 py-3 px-4 font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/[0.06]">
              <p className="text-xs text-zinc-500 mb-3 font-medium">Demo Accounts:</p>
              <div className="space-y-2">
                {mockUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setEmail(user.email);
                      setPassword('password123');
                    }}
                    className="w-full text-left rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 p-3 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-white group-hover:text-violet-300 transition-colors">
                          {user.email}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">{user.name}</p>
                      </div>
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-600 text-center mt-3">
                Password: <span className="text-zinc-500 font-mono">password123</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 backdrop-blur-xl bg-zinc-900/80 border-b border-white/5 px-6 py-4 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <span className="text-xl">🔐</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">PIL Lens</h1>
              <p className="text-xs text-zinc-500">Pharmaceutical Document Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{currentUser?.name}</p>
              <div className="flex items-center gap-2 justify-end mt-0.5">
                <p className="text-xs text-zinc-400">{currentUser?.email}</p>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium border ${getRoleBadgeColor(currentUser?.role)}`}>
                  {currentUser?.role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 py-2 px-4 text-sm font-semibold text-white transition-all border border-white/5"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-white">Dashboard</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Authenticated
            </span>
          </div>
          <p className="text-sm text-zinc-400">Welcome back, {currentUser?.name}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <span className="text-xl">👤</span>
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">User Profile</p>
                <p className="text-lg font-bold text-white">{currentUser?.name}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">Email</span>
                <span className="text-xs text-zinc-300 font-medium">{currentUser?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">Role</span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium border ${getRoleBadgeColor(currentUser?.role)}`}>
                  {currentUser?.role}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">User ID</span>
                <span className="text-xs text-zinc-300 font-mono">#{currentUser?.id}</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <span className="text-xl">🔑</span>
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">Session Info</p>
                <p className="text-lg font-bold text-white">Active</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">Token Type</span>
                <span className="text-xs text-zinc-300 font-medium">JWT (HS256)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">Expires In</span>
                <span className="text-xs text-emerald-400 font-medium">7h 42m</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">IP Address</span>
                <span className="text-xs text-zinc-300 font-mono">192.168.1.105</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <span className="text-xl">🛡️</span>
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">Permissions</p>
                <p className="text-lg font-bold text-white">
                  {currentUser?.role === 'Admin' ? 'Full Access' : 'Role-Based'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span className="text-xs text-zinc-300">View Documents</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span className="text-xs text-zinc-300">Create Submissions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={currentUser?.role === 'Admin' || currentUser?.role === 'RAManager' ? 'text-emerald-400' : 'text-zinc-600'}>
                  {currentUser?.role === 'Admin' || currentUser?.role === 'RAManager' ? '✓' : '✗'}
                </span>
                <span className={`text-xs ${currentUser?.role === 'Admin' || currentUser?.role === 'RAManager' ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  Approve Changes
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Audit Log</h3>
                <p className="text-xs text-zinc-500">Recent system activities</p>
              </div>
            </div>
            <button
              onClick={() => setShowAuditLog(!showAuditLog)}
              className="rounded-xl bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-500 py-2 px-4 text-sm font-semibold text-white transition-all border border-white/5"
            >
              {showAuditLog ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          {showAuditLog && (
            <div className="space-y-3">
              {mockAuditLogs.map(log => {
                const user = mockUsers.find(u => u.id === log.userId);
                return (
                  <div key={log.id} className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="text-xs text-zinc-500">{log.entityType}</span>
                      </div>
                      <span className="text-xs text-zinc-500 font-mono">{formatTimestamp(log.timestamp)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-zinc-500">User:</span>
                        <span className="text-zinc-300 ml-2">
                          {user ? `${user.name} (${user.email})` : 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">IP:</span>
                        <span className="text-zinc-300 ml-2 font-mono">{log.ipAddress}</span>
                      </div>
                    </div>
                    {log.details && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-xs text-zinc-500 mb-2">Details:</p>
                        <div className="bg-black/20 rounded-lg p-3 font-mono text-xs text-zinc-400">
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!showAuditLog && (
            <div className="text-center py-8">
              <p className="text-sm text-zinc-500">Click "Show Details" to view audit logs</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}