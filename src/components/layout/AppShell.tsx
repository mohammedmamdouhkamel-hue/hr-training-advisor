import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import RoleSidebar from './RoleSidebar';
import ImpersonationBanner from './ImpersonationBanner';
import UserMenu from './UserMenu';
import { useAuth } from '../../hooks/useAuth';

const AppShell: React.FC = () => {
  const { isImpersonating } = useAuth();
  const bannerHeight = '48px';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--app-bg, #0F172A)',
        paddingTop: isImpersonating ? bannerHeight : 0,
        transition: 'padding-top 0.28s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Fixed impersonation warning ribbon */}
      <ImpersonationBanner />

      {/* App header */}
      <header
        style={{
          position: 'sticky',
          top: isImpersonating ? bannerHeight : 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          background: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
            }}
          >
            <GraduationCap size={20} color="#fff" />
          </div>
          <span
            style={{
              color: '#F8FAFC',
              fontWeight: 800,
              fontSize: '1rem',
              letterSpacing: '-0.02em',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            HR Training Advisor
          </span>
        </div>
        <UserMenu />
      </header>

      {/* Body: sidebar + main */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <RoleSidebar />
        <motion.main
          key="main-content"
          id="main-content"
          role="main"
          aria-label="Page content"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '28px 32px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(99,102,241,0.25) transparent',
          }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
};

export default AppShell;
