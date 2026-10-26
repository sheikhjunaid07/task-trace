import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { useAppSelector } from '../../app/hooks';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden px-4 py-12 text-center select-none">
      {/* Dynamic Ambient Background Glow that reacts to the theme palette */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[650px] h-[450px] rounded-full blur-[140px] opacity-35 transition-colors duration-500"
        style={{
          background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-10 right-1/4 w-[400px] h-[350px] rounded-full blur-[150px] opacity-20 transition-colors duration-500"
        style={{
          background: 'radial-gradient(circle, var(--accent-2, var(--accent)) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
        {/* 404 Large Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 0.8, 0.32, 1] }}
        >
          <h1
            className="text-8xl sm:text-9xl md:text-[11rem] font-black tracking-tight leading-none"
            style={{
              backgroundImage: 'var(--grad-accent)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 16px 36px var(--glow))',
            }}
          >
            404
          </h1>
        </motion.div>

        {/* Not Found Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="space-y-2 mt-2 mb-8"
        >
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            404 Not Found
          </h2>
          <p className="text-sm sm:text-base text-mute max-w-md mx-auto leading-relaxed">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </motion.div>

        {/* Action Buttons: Back to Dashboard & Go Back */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="btn btn-primary px-6 py-2.5 text-sm font-semibold flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"
          >
            <Home className="w-4 h-4" />
            <span>{isAuthenticated ? 'Back to Dashboard' : 'Return Home'}</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate(isAuthenticated ? '/dashboard' : '/');
              }
            }}
            className="btn btn-surface px-5 py-2.5 text-sm font-medium flex items-center gap-2 hover:bg-surface/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-mute" />
            <span>Go Back</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPage;
