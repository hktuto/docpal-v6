/**
 * Current user composable for demo workspace
 * Auto-assigns a seeded user as the current user for all database operations
 */

export interface CurrentUser {
  id: string
  email: string
  name: string | null
  avatar: string | null
  isSuperAdmin: boolean
}

// Global state for current user (shared across all components)
const currentUser = ref<CurrentUser | null>(null)
const isLoading = ref(false)
const isInitialized = ref(false)
let initPromise: Promise<CurrentUser | null> | null = null

/**
 * Composable for managing the current user in demo mode
 */
export function useCurrentUser() {
  const { query } = usePglite()

  /**
   * Load and set the current user from the database
   * Automatically picks the first user (super admin) or any available user
   */
  async function initCurrentUser(): Promise<CurrentUser | null> {
    if (isInitialized.value) {
      return currentUser.value
    }

    // Use a single promise to prevent concurrent initialization
    if (initPromise) {
      return initPromise
    }

    isLoading.value = true

    initPromise = (async () => {
      try {
        // Get the first user sorted by id (deterministic)
        const users = await query<CurrentUser>(
          `SELECT id, email, name, avatar, is_super_admin as "isSuperAdmin" 
           FROM users 
           ORDER BY id ASC 
           LIMIT 1`
        )

        if (users.length > 0) {
          currentUser.value = users[0]
          console.log('[useCurrentUser] Current user set:', currentUser.value.name || currentUser.value.email)
        } else {
          console.warn('[useCurrentUser] No users found in database')
        }

        isInitialized.value = true
        return currentUser.value
      } catch (error) {
        console.error('[useCurrentUser] Failed to load current user:', error)
        return null
      } finally {
        isLoading.value = false
      }
    })()

    return initPromise
  }

  /**
   * Switch to a different user
   */
  async function switchUser(userId: string): Promise<boolean> {
    try {
      const users = await query<CurrentUser>(
        `SELECT id, email, name, avatar, is_super_admin as "isSuperAdmin" 
         FROM users 
         WHERE id = $1`,
        [userId]
      )

      if (users.length > 0) {
        currentUser.value = users[0]
        console.log('[useCurrentUser] Switched to user:', currentUser.value.name || currentUser.value.email)
        return true
      }

      return false
    } catch (error) {
      console.error('[useCurrentUser] Failed to switch user:', error)
      return false
    }
  }

  /**
   * Get all available users for user switching
   */
  async function getAllUsers(): Promise<CurrentUser[]> {
    try {
      return await query<CurrentUser>(
        `SELECT id, email, name, avatar, is_super_admin as "isSuperAdmin" 
         FROM users 
         ORDER BY is_super_admin DESC, name ASC`
      )
    } catch (error) {
      console.error('[useCurrentUser] Failed to get all users:', error)
      return []
    }
  }

  /**
   * Get current user ID for database operations
   * Returns null if no user is set
   */
  function getCurrentUserId(): string | null {
    return currentUser.value?.id ?? null
  }

  /**
   * Get current user for display purposes
   */
  function getCurrentUser(): CurrentUser | null {
    return currentUser.value
  }

  return {
    // State
    currentUser: readonly(currentUser),
    isLoading: readonly(isLoading),
    isInitialized: readonly(isInitialized),
    
    // Methods
    initCurrentUser,
    switchUser,
    getAllUsers,
    getCurrentUserId,
    getCurrentUser
  }
}

/**
 * Helper to get current user ID synchronously
 * Useful for database operations where you need the user ID
 */
export function getCurrentUserId(): string | null {
  return currentUser.value?.id ?? null
}

/**
 * Helper to get current user synchronously
 */
export function getCurrentUser(): CurrentUser | null {
  return currentUser.value
}
