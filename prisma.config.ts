import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';
import path from 'path';

type Env = {
  DATABASE_URL: string;
};

export default defineConfig({
  schema: path.join('prisma', 'schema'),
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
  engine: 'classic',
  datasource: {
    url: env<Env>('DATABASE_URL'),
  },
});
