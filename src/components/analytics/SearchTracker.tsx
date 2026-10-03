'use client';

import { useEffect, useRef } from 'react';
import { trackGaSearch } from '@/lib/gtag';

export default function SearchTracker({ search }: { search?: string }) {
  const lastSearchTracked = useRef<string | null>(null);

  useEffect(() => {
    if (search && search.trim() && lastSearchTracked.current !== search.trim()) {
      lastSearchTracked.current = search.trim();
      trackGaSearch(search.trim());
    }
  }, [search]);

  return null;
}
