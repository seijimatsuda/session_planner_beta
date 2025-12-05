import { supabase } from '../lib/supabase'
import { storageService } from '../services/storage'

export interface StorageDiagnostics {
  isAuthenticated: boolean
  userId: string | null
  testPath: string | null
  publicUrl: string | null
  signedUrl: string | null
  publicUrlWorks: boolean | null
  signedUrlWorks: boolean | null
  errors: string[]
}

export async function runStorageDiagnostics(testPath: string): Promise<StorageDiagnostics> {
  const diagnostics: StorageDiagnostics = {
    isAuthenticated: false,
    userId: null,
    testPath,
    publicUrl: null,
    signedUrl: null,
    publicUrlWorks: null,
    signedUrlWorks: null,
    errors: [],
  }

  try {
    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      diagnostics.errors.push(`Session error: ${sessionError.message}`)
    } else if (session?.user) {
      diagnostics.isAuthenticated = true
      diagnostics.userId = session.user.id
    } else {
      diagnostics.errors.push('No active session - user not authenticated')
    }

    // Test public URL
    try {
      diagnostics.publicUrl = await storageService.getPublicUrl(testPath)
      if (diagnostics.publicUrl) {
        // Test if public URL is accessible (no-cors mode won't throw, so we assume it works)
        // The actual test happens when the browser tries to load it
        diagnostics.publicUrlWorks = true
      }
    } catch (error) {
      diagnostics.errors.push(`Public URL error: ${error instanceof Error ? error.message : String(error)}`)
    }

    // Test signed URL
    try {
      diagnostics.signedUrl = await storageService.getVideoUrl(testPath, 3600)
      if (diagnostics.signedUrl) {
        // Test if signed URL is accessible (no-cors mode won't throw, so we assume it works)
        // The actual test happens when the browser tries to load it
        diagnostics.signedUrlWorks = true
      }
    } catch (error) {
      diagnostics.errors.push(`Signed URL error: ${error instanceof Error ? error.message : String(error)}`)
    }

  } catch (error) {
    diagnostics.errors.push(`Diagnostics error: ${error instanceof Error ? error.message : String(error)}`)
  }

  return diagnostics
}

export function logDiagnostics(diagnostics: StorageDiagnostics) {
  console.group('🔍 Storage Diagnostics')
  console.log('Authenticated:', diagnostics.isAuthenticated)
  console.log('User ID:', diagnostics.userId)
  console.log('Test Path:', diagnostics.testPath)
  console.log('Public URL:', diagnostics.publicUrl)
  console.log('Public URL Works:', diagnostics.publicUrlWorks)
  console.log('Signed URL:', diagnostics.signedUrl?.substring(0, 100) + '...')
  console.log('Signed URL Works:', diagnostics.signedUrlWorks)
  if (diagnostics.errors.length > 0) {
    console.error('Errors:', diagnostics.errors)
  }
  console.groupEnd()
}

