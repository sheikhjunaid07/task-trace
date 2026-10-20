import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLoginMutation } from '../../../api/authApi';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { setCredentials } from '../authSlice';
import { Kanban, LogIn, AlertCircle, Sparkles, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const workspaceParam = searchParams.get('workspace') || searchParams.get('inviteWorkspace');
  const inviteCodeParam = searchParams.get('inviteCode');
  const redirectParam = searchParams.get('redirect');

  // If user is ALREADY logged in, do not show login page!
  useEffect(() => {
    if (isAuthenticated) {
      if (inviteCodeParam) {
        navigate(`/boards/join/${inviteCodeParam}`, { replace: true });
      } else if (workspaceParam) {
        navigate(`/dashboard?inviteWorkspace=${encodeURIComponent(workspaceParam)}`, { replace: true });
      } else if (redirectParam) {
        navigate(redirectParam, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, workspaceParam, inviteCodeParam, redirectParam, navigate]);

  // Save pending invite in session storage for after login
  useEffect(() => {
    if (workspaceParam || inviteCodeParam) {
      sessionStorage.setItem(
        'tasktrace_pending_invite',
        JSON.stringify({ workspace: workspaceParam, inviteCode: inviteCodeParam })
      );
    }
  }, [workspaceParam, inviteCodeParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setCredentials({ user: res.data.user, token: res.data.token }));

      if (inviteCodeParam) {
        navigate(`/boards/join/${inviteCodeParam}`);
      } else if (workspaceParam) {
        navigate(`/dashboard?inviteWorkspace=${encodeURIComponent(workspaceParam)}`);
      } else if (redirectParam) {
        navigate(redirectParam);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.data?.message || 'Login failed. Please check credentials.');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 overflow-hidden">
      <div className="login-orb" style={{ top: '-140px', right: '-120px' }} />
      <div className="login-orb" style={{ bottom: '-160px', left: '-140px', background: 'var(--glow-2)' }} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 0.8, 0.32, 1] }}
        className="relative w-full max-w-md modal-panel p-8"
      >
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="brand-mark w-14 h-14 mb-4">
            <Kanban className="w-7 h-7" />
          </div>
          <h1 className="text-section text-ink">Welcome Back</h1>
          <p className="text-body text-mute mt-1.5">Sign in to your real-time Kanban workspace</p>
        </div>

        {/* Invited Workspace Banner if present */}
        {workspaceParam && (
          <div className="p-3.5 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] mb-6 text-xs text-ink flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-accent shrink-0" />
            <div>
              <span className="font-semibold block text-ink">
                You've been invited to join "{workspaceParam}"
              </span>
              <span className="text-mute text-[11px]">
                Sign in below to accept this invitation.
              </span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="notice notice-danger mb-6 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="input"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-mute hover:text-ink transition-colors p-1 rounded-md focus:outline-none cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="btn btn-primary w-full py-3.5">
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-[color-mix(in_srgb,var(--on-accent)_35%,transparent)] border-t-[color-mix(in_srgb,var(--on-accent)_90%,transparent)] rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <LogIn className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-mute">
          Don't have an account?{' '}
          <Link
            to={`/register${location.search}`}
            className="font-semibold underline underline-offset-2"
            style={{ color: 'var(--accent)' }}
          >
            Register here
          </Link>
        </p>
      </motion.div>
    </div>
  );
};