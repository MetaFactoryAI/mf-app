import { createTRPCRouter } from './trpc';
import { productRouter } from './products/router';
import { authRouter } from './auth/router';

export const appRouter = createTRPCRouter({
  product: productRouter,
  auth: authRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
