import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const AGENTS = [
  {
    type: 'doctor',
    label: 'Doctor',
    badge: 'MD',
    desc: 'Medical guidance and document analysis',
    accent: 'from-rose-100 to-orange-50 border-rose-200',
  },
  {
    type: 'teacher',
    label: 'Teacher',
    badge: 'ED',
    desc: 'Study help and educational support',
    accent: 'from-sky-100 to-cyan-50 border-sky-200',
  },
  {
    type: 'finance',
    label: 'Finance',
    badge: 'FN',
    desc: 'Financial planning and document review',
    accent: 'from-emerald-100 to-lime-50 border-emerald-200',
  },
  {
    type: 'lawyer',
    label: 'Lawyer',
    badge: 'LG',
    desc: 'Legal guidance and contract analysis',
    accent: 'from-amber-100 to-yellow-50 border-amber-200',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return (
    <div className="min-h-screen bg-hero-wash px-6 py-8 md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-panel backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-tide">Personal AI Advisor</p>
            <h1 className="mt-2 text-4xl font-bold text-ink">Welcome back{user?.name ? `, ${user.name}` : ''}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Choose an advisor, review earlier chats, or upload new documents for retrieval.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/upload')}
              className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Upload Documents
            </button>
            <button
              onClick={() => {
                clearAuth();
                navigate('/login');
              }}
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Log Out
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {AGENTS.map((agent) => (
            <button
              key={agent.type}
              onClick={() => navigate(`/chat/${agent.type}`)}
              className={`group rounded-[2rem] border bg-gradient-to-br ${agent.accent} p-6 text-left shadow-panel transition duration-300 hover:-translate-y-1`}
            >
              <div className="mb-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-sm font-bold tracking-[0.25em] text-ink shadow-sm">
                {agent.badge}
              </div>
              <h2 className="text-2xl font-semibold text-ink">{agent.label} Agent</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{agent.desc}</p>
              <p className="mt-8 text-sm font-semibold text-tide transition group-hover:translate-x-1">
                Open workspace ->
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
