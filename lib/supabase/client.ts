import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check your .env.local file."
    );
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      realtime: {
        logger: (kind: string, msg: string, data?: unknown) => {
          // Enable detailed realtime logging for debugging
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Realtime ${kind}]`, msg, data);
          }
        },
      },
    },
  );
}
