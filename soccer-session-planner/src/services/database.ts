import { supabase } from '../lib/supabase'
import type { Drill, NewDrill, NewSession, Session } from '../types'

// Select statements
const drillSelect = '*'
const sessionSelect = '*'

// Helper to get user emails - we'll batch fetch all unique user IDs
// and create a map. Note: This requires proper RLS on auth.users or a profiles table.
// For now, we'll try to query auth.users directly.
const userEmailCache = new Map<string, string | undefined>()

async function fetchUserEmails(userIds: string[]): Promise<Map<string, string | undefined>> {
  const uniqueIds = [...new Set(userIds)]
  const missingIds = uniqueIds.filter((id) => !userEmailCache.has(id))

  if (missingIds.length === 0) {
    return userEmailCache
  }

  // Note: Direct query of auth.users from client doesn't work.
  // To enable creator attribution, you need to:
  // 1. Create a profiles table with user_id and email, or
  // 2. Create a database function that returns user emails, or
  // 3. Use a server-side API endpoint
  // For now, we'll cache as undefined and UI will gracefully handle it.
  missingIds.forEach((id) => userEmailCache.set(id, undefined))

  return userEmailCache
}

// Helper to enrich drills with creator emails
async function enrichDrillsWithEmails(drills: any[]): Promise<Drill[]> {
  const userIds = drills.map((d) => d.user_id).filter(Boolean)
  if (userIds.length === 0) return drills as Drill[]

  await fetchUserEmails(userIds)

  return drills.map((drill) => ({
    ...drill,
    creator_email: userEmailCache.get(drill.user_id),
  })) as Drill[]
}

// Helper to enrich sessions with creator emails
async function enrichSessionsWithEmails(sessions: any[]): Promise<Session[]> {
  const userIds = sessions.map((s) => s.user_id).filter(Boolean)
  if (userIds.length === 0) return sessions as Session[]

  await fetchUserEmails(userIds)

  return sessions.map((session) => ({
    ...session,
    creator_email: userEmailCache.get(session.user_id),
  })) as Session[]
}

export const drillService = {
  async getAll(): Promise<Drill[]> {
    const { data, error } = await supabase
      .from('drills')
      .select(drillSelect)
      .order('created_at', { ascending: false })

    if (error) throw error
    return await enrichDrillsWithEmails(data ?? [])
  },

  async getById(id: string): Promise<Drill | null> {
    const { data, error } = await supabase
      .from('drills')
      .select(drillSelect)
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return null
    const enriched = await enrichDrillsWithEmails([data])
    return enriched[0] ?? null
  },

  async create(drill: NewDrill & { user_id: string; video_file_path: string | null }): Promise<Drill> {
    const { data, error } = await supabase
      .from('drills')
      .insert(drill)
      .select(drillSelect)
      .single()

    if (error) throw error
    const enriched = await enrichDrillsWithEmails([data])
    return enriched[0]
  },

  async update(id: string, updates: Partial<NewDrill & { video_file_path?: string | null }>): Promise<Drill> {
    const { data, error } = await supabase
      .from('drills')
      .update(updates)
      .eq('id', id)
      .select(drillSelect)
      .single()

    if (error) throw error
    const enriched = await enrichDrillsWithEmails([data])
    return enriched[0]
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('drills').delete().eq('id', id)
    if (error) throw error
  },
}

export const sessionService = {
  async getAll(): Promise<Session[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select(sessionSelect)
      .order('created_at', { ascending: false })

    if (error) throw error
    return await enrichSessionsWithEmails(data ?? [])
  },

  async getById(id: string): Promise<Session | null> {
    const { data, error } = await supabase
      .from('sessions')
      .select(sessionSelect)
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return null
    const enriched = await enrichSessionsWithEmails([data])
    return enriched[0] ?? null
  },

  async create(session: NewSession & { user_id: string }): Promise<Session> {
    const { data, error } = await supabase
      .from('sessions')
      .insert(session)
      .select(sessionSelect)
      .single()

    if (error) throw error
    const enriched = await enrichSessionsWithEmails([data])
    return enriched[0]
  },

  async update(id: string, updates: Partial<NewSession>): Promise<Session> {
    const { data, error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', id)
      .select(sessionSelect)
      .single()

    if (error) throw error
    const enriched = await enrichSessionsWithEmails([data])
    return enriched[0]
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('sessions').delete().eq('id', id)
    if (error) throw error
  },
}

