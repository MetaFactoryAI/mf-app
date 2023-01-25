import { protectedProcedure, publicProcedure, createTRPCRouter } from '../trpc';

export const authRouter = createTRPCRouter({
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),
  getSecretMessage: protectedProcedure.query(() => {
    // testing type validation of overridden SIWE Session
    return 'you can see this secret message!';
  }),
});
