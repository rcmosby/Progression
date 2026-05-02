'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Dumbbell, ListChecks, TrendingUp, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/',         label: 'Home',     icon: Home },
  { href: '/programs', label: 'Programs', icon: ListChecks },
  { href: '/workout',  label: 'Workout',  icon: Dumbbell },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/body',     label: 'Body',     icon: User },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-panel border-t border-edge">
      <div className="flex items-stretch" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 py-2 gap-0.5 text-xs font-medium transition-colors ${
                isActive ? 'text-brand' : 'text-dim hover:text-body'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
