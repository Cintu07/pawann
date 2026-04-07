"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import ResumeModal from './ResumeModal';

export default function Navigation() {
  const pathname = usePathname();
  const [isResumeOpen, setIsResumeOpen] = useState(false);

  const links = [
    { path: '/', label: 'home', k: 'h' },
    { path: '/blog', label: 'blog', k: 'b' },
    { path: '/experience', label: 'experience', k: 'e' },
    { path: '/projects', label: 'projects', k: 'p' },
  ];

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
                  className={`block py-1 transition-all duration-300 ${isActive ? 'text-white' : 'hover:text-neutral-300'}`}
                >
                  <span className="opacity-40 group-hover:opacity-80 transition-opacity">[{link.k}]</span> {link.label}
                </Link>
              </li>
            );
          })}
          
          {/* Resume Modal Trigger */}
          <li className="relative group ml-auto md:ml-0">
            <button 
              onClick={() => setIsResumeOpen(true)}
              className="block py-1 transition-all duration-300 hover:text-white"
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
