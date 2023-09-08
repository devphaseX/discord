'use client';

import { useOrigin } from '@/hooks/use-origin';
import { useClerk } from '@clerk/nextjs';
import { debug } from 'console';
import { useEffect, useRef } from 'react';
import { useIsMounted } from 'usehooks-ts';

interface ClientRedirectAuthProps {
  createRoutePath: ((origin: string) => string) | string;
}

// export const INVITE_LOCAL_STORAGE_KEY = 'invite_url';
export const ClientRedirectAuth = ({
  createRoutePath,
}: ClientRedirectAuthProps) => {
  const origin = useOrigin();
  const clerk = useClerk();
  let hasRedirect = useRef(false);

  useEffect(() => {
    if (origin === null || origin === '') return;

    let redirectUrl =
      typeof createRoutePath === 'function'
        ? createRoutePath(origin)
        : `${origin.replace(/\/+$/, '')}/${createRoutePath.replace(
            /^\/+/,
            ''
          )}`;

    if (!hasRedirect.current && (hasRedirect.current = true)) {
      clerk.redirectToSignIn({
        afterSignUpUrl: createRoutePath.toString(),
        redirectUrl: createRoutePath.toString(),
      });
    }
  }, [origin]);

  return null;
};
