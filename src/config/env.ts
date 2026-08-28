// Validates Vite-exposed environment variables once, at module load time,
// so a missing/malformed var fails fast with a readable error instead of
// surfacing as a cryptic runtime crash somewhere deep in a component tree.
// Import `env` from here everywhere on the frontend — never read
// `import.meta.env` directly outside this file.

import { z } from "zod";

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url("VITE_SUPABASE_URL must be a valid URL"),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, "VITE_SUPABASE_ANON_KEY is required"),
  VITE_SUPABASE_FUNCTIONS_URL: z.string().url("VITE_SUPABASE_FUNCTIONS_URL must be a valid URL"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(import.meta.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    // eslint-disable-next-line no-console -- intentional startup diagnostic, not app logging
    console.error(
      `\n[env] Invalid or missing environment variables:\n${issues}\n\n` +
        "Copy .env.example to .env.local and fill in the values printed by `supabase start`.\n",
    );

    throw new Error("Environment validation failed — see console output above for details.");
  }

  return parsed.data;
}

export const env: Env = loadEnv();
