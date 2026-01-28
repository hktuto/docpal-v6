/**
 * User seeding utility for demo database
 * Creates 20 deterministic mock users if the users table is empty
 */

// Predefined users list (deterministic - same users every time)
const predefinedUsers = [
  { firstName: 'Alice', lastName: 'Anderson', color: '3498db' },
  { firstName: 'Bob', lastName: 'Brown', color: 'e74c3c' },
  { firstName: 'Charlie', lastName: 'Chen', color: '2ecc71' },
  { firstName: 'Diana', lastName: 'Davis', color: '9b59b6' },
  { firstName: 'Edward', lastName: 'Evans', color: 'f39c12' },
  { firstName: 'Fiona', lastName: 'Foster', color: '1abc9c' },
  { firstName: 'George', lastName: 'Garcia', color: 'e91e63' },
  { firstName: 'Hannah', lastName: 'Harris', color: '00bcd4' },
  { firstName: 'Ivan', lastName: 'Ivanov', color: 'ff5722' },
  { firstName: 'Julia', lastName: 'Johnson', color: '607d8b' },
  { firstName: 'Kevin', lastName: 'Kim', color: '3498db' },
  { firstName: 'Laura', lastName: 'Lee', color: 'e74c3c' },
  { firstName: 'Michael', lastName: 'Martinez', color: '2ecc71' },
  { firstName: 'Nancy', lastName: 'Nguyen', color: '9b59b6' },
  { firstName: 'Oscar', lastName: 'Olsen', color: 'f39c12' },
  { firstName: 'Patricia', lastName: 'Patel', color: '1abc9c' },
  { firstName: 'Quincy', lastName: 'Quinn', color: 'e91e63' },
  { firstName: 'Rachel', lastName: 'Rodriguez', color: '00bcd4' },
  { firstName: 'Steven', lastName: 'Smith', color: 'ff5722' },
  { firstName: 'Tina', lastName: 'Taylor', color: '607d8b' }
]

/**
 * Generate a deterministic UUID based on index
 * Uses a fixed pattern so the same index always produces the same UUID
 */
function generateDeterministicUUID(index: number): string {
  // Create a deterministic UUID using the index
  // Format: 00000000-0000-4000-8000-000000000001 (for index 0)
  const hex = index.toString(16).padStart(12, '0')
  return `00000000-0000-4000-8000-${hex}`
}

/**
 * Generate a mock user with deterministic data
 */
function generateMockUser(index: number) {
  const user = predefinedUsers[index]
  const name = `${user.firstName} ${user.lastName}`
  const email = `${user.firstName.toLowerCase()}.${user.lastName.toLowerCase()}@example.com`
  // Using UI Avatars for placeholder avatar
  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${user.color}&color=fff&size=128`
  
  return {
    id: generateDeterministicUUID(index),
    email,
    name,
    avatar,
    password: 'demo123', // Simple password for demo
    isSuperAdmin: index === 0, // First user is super admin
    emailVerifiedAt: '2024-01-01T00:00:00.000Z', // Fixed date for determinism
    lastLoginAt: null,
    updateToken: null,
    createdAt: '2024-01-01T00:00:00.000Z', // Fixed date for determinism
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
}

/**
 * Seed users table with mock data if empty
 * @param query - Query function from usePglite
 * @param exec - Exec function from usePglite
 * @returns Number of users created (0 if table was not empty)
 */
export async function seedUsers(
  query: <T = any>(sql: string, params?: any[]) => Promise<T[]>,
  exec: (sql: string) => Promise<void>
): Promise<number> {
  try {
    // Check if users table exists and has any records
    const existingUsers = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM users`
    )
    
    const count = parseInt(existingUsers[0]?.count || '0', 10)
    
    if (count > 0) {
      console.log(existingUsers)
      console.log(`[Seed] Users table already has ${count} records, skipping seed`)
      return 0
    }
    
    console.log('[Seed] Users table is empty, creating 20 mock users...')
    
    // Generate 20 mock users
    const users = Array.from({ length: 20 }, (_, i) => generateMockUser(i))
    
    // Insert users one by one (PGlite doesn't support batch insert well with params)
    for (const user of users) {
      await query(
        `INSERT INTO users (id, email, name, avatar, password, is_super_admin, email_verified_at, last_login_at, _update_token, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          user.id,
          user.email,
          user.name,
          user.avatar,
          user.password,
          user.isSuperAdmin,
          user.emailVerifiedAt,
          user.lastLoginAt,
          user.updateToken,
          user.createdAt,
          user.updatedAt
        ]
      )
    }
    
    console.log(`[Seed] Successfully created ${users.length} mock users`)
    return users.length
  } catch (error) {
    // Table might not exist yet, that's fine - migrations haven't run
    console.warn('[Seed] Could not seed users:', error)
    return 0
  }
}

/**
 * Get list of all seeded users
 */
export async function getSeededUsers(
  query: <T = any>(sql: string, params?: any[]) => Promise<T[]>
) {
  return query<{
    id: string
    email: string
    name: string
    avatar: string
    isSuperAdmin: boolean
  }>(`SELECT id, email, name, avatar, is_super_admin as "isSuperAdmin" FROM users ORDER BY created_at`)
}
