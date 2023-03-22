import { createTRPCRouter } from './trpc';
import { productRouter } from './products/router';
import { authRouter } from './auth/router';
import { claimsRouter } from './claims/router';

export const appRouter = createTRPCRouter({
  product: productRouter,
  auth: authRouter,
  claims: claimsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
