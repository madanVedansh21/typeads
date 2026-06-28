/**
 * Helper to safely cast Supabase query results to known types.
 * Supabase's TypeScript generics can sometimes return 'never' when
 * the Database type doesn't perfectly match the runtime query shape.
 */
export function castAs<T>(data: unknown): T | null {
  return data as T | null
}

export function castArrayAs<T>(data: unknown): T[] {
  if (!Array.isArray(data)) return []
  return data as T[]
}
