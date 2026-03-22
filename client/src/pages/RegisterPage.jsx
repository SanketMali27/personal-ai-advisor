import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/services';
import { useAuthStore } from '../store/authStore';

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  age: '',
  educationLevel: '',
  medicalHistorySummary: '',
  financialSummary: '',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...form,
        age: form.age ? Number(form.age) : undefined,
      };
      const { data } = await authAPI.register(payload);
      setAuth(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to register.');
    } finally {
      setLoading(false);
    }
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="min-h-screen bg-hero-wash px-6 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-panel backdrop-blur">
        <p className="text-sm uppercase tracking-[0.25em] text-tide">Personal AI Advisor</p>
        <h1 className="mt-3 text-3xl font-bold text-ink">Create your account</h1>
        <p className="mt-2 text-sm text-slate-500">
          Add the basics now. You can expand your profile and documents later.
        </p>

        <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full name"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-tide focus:bg-white"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-tide focus:bg-white"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
            className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-tide focus:bg-white"
            required
          />
          <input
            type="number"
            placeholder="Age"
            value={form.age}
            onChange={(event) => updateField('age', event.target.value)}
            className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-tide focus:bg-white"
          />
          <input
            type="text"
            placeholder="Education level"
            value={form.educationLevel}
            onChange={(event) => updateField('educationLevel', event.target.value)}
            className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-tide focus:bg-white md:col-span-2"
          />
          <textarea
            placeholder="Medical history summary"
            value={form.medicalHistorySummary}
            onChange={(event) => updateField('medicalHistorySummary', event.target.value)}
            className="min-h-28 rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-tide focus:bg-white"
          />
          <textarea
            placeholder="Financial summary"
            value={form.financialSummary}
            onChange={(event) => updateField('financialSummary', event.target.value)}
            className="min-h-28 rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-tide focus:bg-white"
          />

          {error ? <p className="text-sm text-red-600 md:col-span-2">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70 md:col-span-2"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-tide hover:text-ink">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
