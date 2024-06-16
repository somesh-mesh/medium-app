import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  },
  Variables: {
    userId: string
  }
}>();

blogRouter.use(async (c, next) => {
  const jwt = c.req.header('Authorization');
  if (!jwt) {
    c.status(401);
    return c.json({ error: "Unauthorized" });
  }
  const token = jwt.split(' ')[1];
  try {
    const decoded = await verify(token, c.env.JWT_SECRET);
    //@ts-ignore
    c.set('userId', decoded.id);
    await next();
  } catch (e) {
    c.status(401);
    return c.json({ error: "Unauthorized" });
  }
});

blogRouter.post('/', async (c) => {
  const userId = c.get('userId');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: c.env?.DATABASE_URL,
      },
    },
  }).$extends(withAccelerate());

  const body = await c.req.json();
  try {
    const post = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: userId
      }
    });
    return c.json({ id: post.id });
  } catch (e) {
    console.error("Error creating post:", e);
    c.status(500);
    return c.json({ error: "Error creating post" });
  }
});

blogRouter.put("/", async (c) => {
  const userId = c.get("userId");
  if (!userId) {
    c.status(403);
    return c.json({ error: "Unauthorized" });
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: c.env?.DATABASE_URL,
      },
    },
  }).$extends(withAccelerate());

  const body = await c.req.json();
  try {
    const updatedPost = await prisma.post.update({
      where: {
        id: body.id,
        authorId: userId
      },
      data: {
        title: body.title,
        content: body.content
      }
    });
    return c.json({ id: updatedPost.id, message: "Updated post" });
  } catch (e) {
    console.error("Error updating post:", e);
    c.status(500);
    return c.json({ error: "Error updating post" });
  }
});

blogRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: c.env?.DATABASE_URL,
      },
    },
  }).$extends(withAccelerate());

  try {
    const post = await prisma.post.findUnique({
      where: {
        id
      }
    });
    if (post) {
      return c.json(post);
    } else {
      c.status(404);
      return c.json({ error: "Post not found" });
    }
  } catch (e) {
    console.error("Error fetching post:", e);
    c.status(500);
    return c.json({ error: "Error fetching post" });
  }
});

blogRouter.get('/bulk', async (c) => {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: c.env?.DATABASE_URL,
      },
    },
  }).$extends(withAccelerate());

  try {
    const posts = await prisma.post.findMany({});
    return c.json(posts);
  } catch (e) {
    console.error("Error fetching posts:", e);
    c.status(500);
    return c.json({ error: "Error fetching posts" });
  }
});
