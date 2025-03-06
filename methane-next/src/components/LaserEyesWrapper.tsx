'use client';

import { LaserEyesProvider } from '@omnisat/lasereyes';

export default function LaserEyesWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LaserEyesProvider config={{ network: 'mainnet' }}>
      {children}
    </LaserEyesProvider>
  );
}
