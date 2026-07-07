'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollRestoration() {
  const pathname = usePathname();
  const scrollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const savedPosition = sessionStorage.getItem(`scroll-position-${pathname}`);

    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition, 10));
    }

const handleScroll = () => {
  if (scrollTimeoutRef.current !== null) {
    return;
  }

  sessionStorage.setItem(
    `scroll-position-${pathname}`,
    window.scrollY.toString()
  );

  scrollTimeoutRef.current = window.setTimeout(() => {
    scrollTimeoutRef.current = null;
  }, 100);
};

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);

      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [pathname]);

  return null;
}
