import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { createUpload, updateUploadStats, getUserUploads, getUploadStats } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  uploads: router({
    list: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      return getUserUploads(ctx.user.id);
    }),
    stats: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      return getUploadStats(ctx.user.id);
    }),
    create: publicProcedure
      .input(z.object({
        filename: z.string(),
        originalFilename: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        githubUrl: z.string(),
        cdnLink: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        
        await createUpload({
          userId: ctx.user.id,
          ...input,
        });

        const allUploads = await getUserUploads(ctx.user.id);
        const totalUploads = allUploads.length;
        const totalSize = allUploads.reduce((sum, u) => sum + u.fileSize, 0);
        
        await updateUploadStats(ctx.user.id, totalUploads, totalSize);
        
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
