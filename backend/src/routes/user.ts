import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { sign, verify } from "hono/jwt";
import { withAccelerate } from "@prisma/extension-accelerate";

const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

userRouter.post("/signup", async (c) => {
  console.log("DATABASE_URL:", c.env?.DATABASE_URL);
  console.log("JWT_SECRET:", c.env?.JWT_SECRET);

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: c.env?.DATABASE_URL,
      },
    },
  }).$extends(withAccelerate());

  const body = await c.req.json();
  if (!body.email || !body.password) {
    c.status(400);
    return c.json({ error: "Email and password are required" });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      c.status(409); // Conflict status code
      return c.json({ error: "User already exists" });
    }

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: body.password,
      },
    });

    const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
    return c.json({ jwt });
  } catch (e) {
    console.error("Error during signup:", e);
    c.status(500); // Internal Server Error status code
    return c.json({ error: "Error while signing up" });
  }
});

userRouter.post("/signin", async (c) => {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: c.env?.DATABASE_URL,
      },
    },
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const user = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
  });

  if (!user) {
    c.status(403);
    return c.json({ error: "User not found" });
  }

  const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
  return c.json({ jwt });
});

export default userRouter;
