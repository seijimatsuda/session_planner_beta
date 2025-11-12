import { supabase } from '../lib/supabase'
import type { Drill, NewDrill, NewSession, Session } from '../types'

const drillSelect = '*'
const sessionSelect = '*'

export const drillService = {
  async getAll(): Promise<Drill[]> {
    const { data, error } = await supabase
      .from('drills')
      .select(drillSelect)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  async getById(id: string): Promise<Drill | null> {
    const { data, error } = await supabase
      .from('drills')
      .select(drillSelect)
      .eq('id', id)
      .single()

    if (error) throw error
    return data ?? null
  },

  async create(drill: NewDrill & { user_id: string; video_file_path: string | null }): Promise<Drill> {
    const { data, error } = await supabase
      .from('drills')
      .insert(drill)
      .select(drillSelect)
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<NewDrill & { video_file_path?: string | null }>): Promise<Drill> {
    const { data, error } = await supabase
      .from('drills')
      .update(updates)
      .eq('id', id)
      .select(drillSelect)
      .single()

    if (error) throw error
    return data
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
    return data ?? []
  },

  async getById(id: string): Promise<Session | null> {
    const { data, error } = await supabase
      .from('sessions')
      .select(sessionSelect)
      .eq('id', id)
      .single()

    if (error) throw error
    return data ?? null
  },

  async create(session: NewSession & { user_id: string }): Promise<Session> {
    const { data, error } = await supabase
      .from('sessions')
      .insert(session)
      .select(sessionSelect)
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<NewSession>): Promise<Session> {
    const { data, error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', id)
      .select(sessionSelect)
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('sessions').delete().eq('id', id)
    if (error) throw error
  },
}

