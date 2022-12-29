import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';

type Props = {
  session: Session;
  children: React.ReactNode;
};

export const NextAuthProvider: React.FC<Props> = ({ children, session }) => {
  return (
    <SessionProvider session={session} refetchInterval={0}>
      {children}
    </SessionProvider>
  );
};
