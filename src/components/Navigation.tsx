"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import ResumeModal from './ResumeModal';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isResumeOpen, setIsResumeOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const links = [
    { path: '/', label: 'home', k: 'h' },
    { path: '/blog', label: 'blog', k: 'b' },
    { path: '/experience', label: 'experience', k: 'e' },
    { path: '/projects', label: 'projects', k: 'p' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'h':
          router.push('/');
          break;
        case 'b':
          router.push('/blog');
          break;
        case 'e':
          router.push('/experience');
          break;
        case 'p':
          router.push('/projects');
          break;
        case 'r':
          setIsResumeOpen((prev) => !prev);
          break;
        case 't':
          setTheme(theme === 'dark' ? 'light' : 'dark');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, theme, setTheme]);

  return (
    <>
      <nav className="mb-14 sm:mb-20">
        <ul className="flex flex-wrap gap-4 sm:gap-8 font-mono text-[14px] sm:text-[15px] tracking-wide text-neutral-500">
          {links.map((link) => {
            const isActive = pathname === link.path;
            return (
              <li key={link.path} className="relative group">
                <Link 
                  href={link.path}
                  className={`block py-1 transition-all duration-300 ${isActive ? 'text-foreground' : 'hover:text-neutral-300'}`}
                >
                  <span className="opacity-40 group-hover:opacity-80 transition-opacity">[{link.k}]</span> {link.label}
                </Link>
              </li>
            );
          })}
          
          {/* Theme Toggle Button */}
          <li className="relative group">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="block py-1 transition-all duration-300 hover:text-foreground cursor-pointer text-left"
            >
              <span className="opacity-40 group-hover:opacity-80 transition-opacity">[t]</span> {mounted ? (theme === 'dark' ? 'light' : 'dark') : 'theme'}
            </button>
          </li>
          
          {/* Resume Modal Trigger */}
          <li className="relative group ml-auto md:ml-0">
            <button 
              onClick={() => setIsResumeOpen(true)}
              className="block py-1 transition-all duration-300 hover:text-foreground cursor-pointer"
            >
              <span className="opacity-40 group-hover:opacity-80 transition-opacity">[r]</span> resume
            </button>
          </li>
        </ul>
      </nav>

      {/* Render the Resume Modal overlay */}
      <ResumeModal isOpen={isResumeOpen} onClose={() => setIsResumeOpen(false)} />
    </>
  );
}
