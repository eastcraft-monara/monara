'use client';

import { useEffect } from 'react';

export default function PvPMatch() {
  useEffect(() => {
    const id = window.location.pathname.split('/').pop();
    window.location.href = `/?join=${id}`;
  }, []);

  return <div style={{ color: "white", padding: 20, fontFamily: 'monospace' }}>Redirecting to Battle Arena...</div>;
}
