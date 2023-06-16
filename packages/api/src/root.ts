import { authRouter } from './auth/router';
import { productRouter } from './products/router';
import { createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({
  product: productRouter,
  auth: authRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
