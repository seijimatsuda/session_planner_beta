export type Category = 'activation' | 'dribbling' | 'passing' | 'shooting'

export interface Drill {
  id: string
  created_at: string
  name: string
  video_url: string
  video_file_path: string | null
  category: Category
  num_players: number | null
  equipment: string[]
  tags: string[]
  user_id: string
}

export interface GridCell {
  drillId: string
  position: number
}

export interface Session {
  id: string
  created_at: string
  name: string
  grid_data: {
    grid: (GridCell | null)[][]
  }
  user_id: string
}

export type NewDrill = Omit<Drill, 'id' | 'created_at' | 'user_id' | 'video_file_path'>
export type NewSession = Omit<Session, 'id' | 'created_at' | 'user_id'>

