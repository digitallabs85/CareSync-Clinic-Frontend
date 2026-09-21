// app/dashboard/_components/TopNav.tsx
"use client"
import React, { useState } from 'react';
import { User, Activity, LogOut, Stethoscope, BriefcaseMedical, Plus, Menu, X, ChevronDown } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { apiService } from '@/app/_utils/apiService';
import { useUserProfile } from '@/app/_context/UserProfileContext';
import SignOutDialog from '@/app/sign-in/_components/SignOutDialog';
import app from '../../../app.json';
import logo from '/public/logo.png'
import Image from 'next/image';

type NavbarVariant = 'demographic' | 'vitals' | 'onlineConsult'
interface TopNavProps { variant: NavbarVariant; onAddToken?: () => void; }

const SUBTITLES: Record<NavbarVariant, string> = {
  demographic: '', vitals: 'Vitals', onlineConsult: 'Online Consultation'
};

export default function TopNav({ variant, onAddToken }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const { profile, loading } = useUserProfile();

  const items = [
    { name: 'Demographic', path: '/dashboard/demographic/', icon: <User size={16} />, key: 'demographic' },
    { name: 'Vitals', path: '/dashboard/vitals/', icon: <Activity size={16} />, key: 'vitals' },
    { name: 'Consult', path: '/dashboard/onlineConsult/', icon: <Stethoscope size={16} />, key: 'onlineConsultation' },
    // { name: 'Pharmacy', path: '/dashboard/pharmacy/', icon: <BriefcaseMedical size={16} />, key: 'pharmacy' },
  ].filter(i => apiService.getPagePermissions()[i.key]);

  const signOut = () => {
    ['token', 'user', 'page_permissions', 'localClinic_session', 'localClinic_entryId'].forEach(k => localStorage.removeItem(k));
    router.push('/sign-in');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-skeuo-surface bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-18  max-w-7xl justify-between items-center gap-3 px-3 sm:px-5">

          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Image alt='logo' src={logo} className='w-10'/>
            <div className="hidden sm:block">
              <p className="text-xl font-extrabold text-skeuo-text leading-tight">{app.name}</p>
            </div>
          </div>

          {/* Desktop nav pills */}
          <nav className="hidden md:flex w-fit items-center gap-1.5 mx-2">
            {items.map(item => {
              const active = pathname === item.path;
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.path)}
                  className={`flex items-center gap-1.5 cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all ${
                    active ? 'bg-skeuo-red text-white shadow-sm' : 'text-skeuo-muted hover:bg-skeuo-surface hover:text-skeuo-text'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Right side */}
          <div className=" flex items-center gap-2">
            {variant === 'vitals' && onAddToken && (
              <button
                onClick={onAddToken}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-skeuo-red px-3.5 py-1.5 text-xs font-bold text-white hover:bg-skeuo-red-dark transition-colors"
              >
                <Plus size={14} /> Add Token
              </button>
            )}

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(p => !p)}
                className="flex items-center gap-2 rounded-full border border-skeuo-surface bg-white px-2 py-1 hover:bg-skeuo-base"
              >
                <div className="grid h-7 w-7 place-items-center rounded-full bg-skeuo-red text-xs font-bold text-white">
                  {(profile?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <ChevronDown size={14} className="text-skeuo-muted" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border border-skeuo-surface bg-white p-3 shadow-xl shadow-black/10">
                    {loading ? (
                      <p className="text-xs italic text-skeuo-muted">Loading…</p>
                    ) : (
                      <>
                        {profile?.name && (
                          <div className="mb-2 rounded-lg bg-skeuo-base px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-skeuo-muted">Project</p>
                            <p className="truncate text-sm font-semibold text-skeuo-text">{profile.name}</p>
                          </div>
                        )}
                        {profile?.location && (
                          <div className="mb-2 rounded-lg bg-skeuo-base px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-skeuo-muted">Location</p>
                            <p className="truncate text-sm font-semibold text-skeuo-text">{profile.location}</p>
                          </div>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => { setProfileOpen(false); setSignOutOpen(true); }}
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-skeuo-muted hover:bg-skeuo-red/10 hover:text-skeuo-red"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-skeuo-surface text-skeuo-muted"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 h-dvh w-72 bg-white shadow-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-skeuo-text">Menu</p>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-skeuo-surface">
                <X size={20} />
              </button>
            </div>
            {variant === 'vitals' && onAddToken && (
              <button
                onClick={() => { onAddToken(); setDrawerOpen(false); }}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-skeuo-red py-2.5 text-sm font-bold text-white"
              >
                <Plus size={16} /> Add Token
              </button>
            )}
            <nav className="space-y-1">
              {items.map(item => {
                const active = pathname === item.path;
                return (
                  <button
                    key={item.name}
                    onClick={() => { router.push(item.path); setDrawerOpen(false); }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                      active ? 'bg-skeuo-red text-white' : 'text-skeuo-muted hover:bg-skeuo-surface'
                    }`}
                  >
                    {item.icon} {item.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <SignOutDialog open={signOutOpen} onConfirm={signOut} onCancel={() => setSignOutOpen(false)} />
    </>
  );
}