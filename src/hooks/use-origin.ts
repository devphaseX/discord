import { useEffect, useState } from 'react';
import { useIsClient } from 'usehooks-ts';

export const useOrigin = () => {
  const [mounted, setMounted] = useState(false);

  const runEnvIsClient = useIsClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  const origin =
    runEnvIsClient && window.location.origin ? window.location.origin : '';
  return origin;
};
