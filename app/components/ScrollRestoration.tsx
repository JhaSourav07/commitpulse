'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollRestoration() {
  const pathname = usePathname();

  useEffect(() => {
    const savedPosition = sessionStorage.getItem(`scroll-position-${pathname}`);

    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition, 10));
    }

    const handleScroll = () => {
      sessionStorage.setItem(`scroll-position-${pathname}`, window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);

  return null;
}
