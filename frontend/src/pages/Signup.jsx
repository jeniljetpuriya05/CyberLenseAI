import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

import { Shield, Eye, EyeOff, Lock, Mail, UserPlus, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  'AI-powered packet forensics',
  'Real-time threat detection & classification',
  'Professional investigation case management',
];

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!name) errs.name = 'Full name is required';
    if (!email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    setErrors({});
    try {
      await api.register({ name, email, password });
      await api.login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setErrors({ email: err.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute top-1/4 -right-24 w-80 h-80 bg-white/5 rounded-full" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-white/5 rounded-full" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none">CyberLens AI</p>
              <p className="text-blue-200 text-xs mt-0.5">Network & Packet Forensics</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          <div className="mb-10">
            <svg viewBox="0 0 420 280" className="w-full max-w-md opacity-90" fill="none">
              <circle cx="210" cy="140" r="24" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />
              <circle cx="210" cy="140" r="10" fill="white" fillOpacity="0.6" />
              <circle cx="80" cy="70" r="16" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.25" strokeWidth="1" />
              <circle cx="80" cy="70" r="6" fill="white" fillOpacity="0.5" />
              <circle cx="340" cy="80" r="16" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.25" strokeWidth="1" />
              <circle cx="340" cy="80" r="6" fill="white" fillOpacity="0.5" />
              <circle cx="60" cy="210" r="14" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
              <circle cx="60" cy="210" r="5" fill="white" fillOpacity="0.45" />
              <circle cx="360" cy="200" r="14" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
              <circle cx="360" cy="200" r="5" fill="white" fillOpacity="0.45" />
              <circle cx="150" cy="240" r="12" fill="white" fillOpacity="0.09" stroke="white" strokeOpacity="0.18" strokeWidth="1" />
              <circle cx="150" cy="240" r="4" fill="white" fillOpacity="0.4" />
              <circle cx="280" cy="230" r="12" fill="white" fillOpacity="0.09" stroke="white" strokeOpacity="0.18" strokeWidth="1" />
              <circle cx="280" cy="230" r="4" fill="white" fillOpacity="0.4" />
              <line x1="210" y1="140" x2="80" y2="70" stroke="white" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4 3" />
              <line x1="210" y1="140" x2="340" y2="80" stroke="white" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4 3" />
              <line x1="210" y1="140" x2="60" y2="210" stroke="white" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4 3" />
              <line x1="210" y1="140" x2="360" y2="200" stroke="white" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4 3" />
              <line x1="210" y1="140" x2="150" y2="240" stroke="white" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4 3" />
              <line x1="210" y1="140" x2="280" y2="230" stroke="white" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4 3" />
              <line x1="80" y1="70" x2="340" y2="80" stroke="white" strokeOpacity="0.12" strokeWidth="1" />
              <line x1="60" y1="210" x2="150" y2="240" stroke="white" strokeOpacity="0.12" strokeWidth="1" />
              <line x1="360" y1="200" x2="280" y2="230" stroke="white" strokeOpacity="0.12" strokeWidth="1" />
              <circle cx="340" cy="80" r="30" fill="none" stroke="#FCA5A5" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="5 3" />
              <circle cx="145" cy="105" r="4" fill="#FCD34D" fillOpacity="0.8" />
              <circle cx="275" cy="110" r="3" fill="#6EE7B7" fillOpacity="0.8" />
              <circle cx="135" cy="175" r="3" fill="#93C5FD" fillOpacity="0.8" />
              <text x="210" y="173" textAnchor="middle" fill="white" fillOpacity="0.5" fontSize="9" fontFamily="Inter, sans-serif">Analysis Hub</text>
              <text x="340" y="110" textAnchor="middle" fill="#FCA5A5" fillOpacity="0.8" fontSize="8" fontFamily="Inter, sans-serif">⚠ Threat</text>
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
            Start your investigation<br />with secure access.
          </h2>
          <p className="text-blue-200 text-base leading-relaxed mb-8 max-w-sm">
            Create a new CyberLens AI account for secure packet forensics, incident response, and threat intelligence workflows.
          </p>

          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-blue-300 flex-shrink-0" />
                <span className="text-blue-100 text-sm">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10">
          <p className="text-blue-300 text-xs">
            CyberLens AI &copy; 2024 &middot; Jenil Jetpuriya &amp; Manthan Chavda
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-900 font-bold">CyberLens AI</p>
              <p className="text-gray-400 text-xs">Network & Packet Forensics</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
            <p className="text-gray-500 text-sm mt-1.5">
              Join CyberLens AI to access investigation tools and analytics.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <div className="relative">
                <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: '' })); }}
                  placeholder="Jane Doe"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl bg-white text-gray-900 placeholder:text-gray-400 transition-all
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                    ${errors.name ? 'border-red-400 bg-red-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                />
              </div>
              {errors.name && <p className="text-xs text-red-500 mt-1.5">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: '' })); }}
                  placeholder="analyst@cyberlens.ai"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl bg-white text-gray-900 placeholder:text-gray-400 transition-all
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                    ${errors.email ? 'border-red-400 bg-red-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1.5">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: '' })); }}
                  placeholder="Create a password"
                  className={`w-full pl-10 pr-11 py-2.5 text-sm border rounded-xl bg-white text-gray-900 placeholder:text-gray-400 transition-all
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                    ${errors.password ? 'border-red-400 bg-red-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1.5">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrors((prev) => ({ ...prev, confirmPassword: '' })); }}
                  placeholder="Confirm password"
                  className={`w-full pl-10 pr-11 py-2.5 text-sm border rounded-xl bg-white text-gray-900 placeholder:text-gray-400 transition-all
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                    ${errors.confirmPassword ? 'border-red-400 bg-red-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1.5">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Sign in
            </Link>
          </p>

          <p className="mt-6 text-center text-xs text-gray-400">
            CyberLens AI © 2024 • Jenil Jetpuriya & Manthan Chavda
          </p>
        </div>
      </div>
    </div>
  );
}
