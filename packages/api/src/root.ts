import { createTRPCRouter } from './trpc';
import { productRouter } from './products/router';
import { authRouter } from './auth/router';
import { wearablesRouter } from './wearables/router';

export const appRouter = createTRPCRouter({
  product: productRouter,
  auth: authRouter,
  wearables: wearablesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
