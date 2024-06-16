import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { sign, verify } from "hono/jwt";
import { withAccelerate } from "@prisma/extension-accelerate";
import userRouter from "./user";
import { blogRouter } from "./blog";


const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

app.route('/api/v1/user', userRouter);
app.route('/api/v1/blog', blogRouter);

export default app;
