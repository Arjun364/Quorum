import { defineConfig } from 'prisma/config';

// Multi-file schema: one file per model in prisma/schema.
// Migration SQL is generated into prisma/migrations and committed with the code;
// the database records every applied migration in its _prisma_migrations table.
export default defineConfig({
  schema: 'prisma/schema',
  migrations: { path: 'prisma/migrations' },
});
