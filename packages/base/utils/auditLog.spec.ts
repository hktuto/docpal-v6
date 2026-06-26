import { describe, it, expect } from 'vitest'
import { groupAuditLogsByDate } from './auditLog'

interface AuditLog {
  timestamp?: string
  user_id: string
  action?: string
}

interface GroupedAuditLog {
  date: string
  items: AuditLog[]
}

describe('groupAuditLogsByDate', () => {
  it('returns an empty array when given an empty array', () => {
    expect(groupAuditLogsByDate([])).toEqual([])
  })

  it('returns an empty array when given null', () => {
    expect(groupAuditLogsByDate(null as unknown as AuditLog[])).toEqual([])
  })

  it('returns an empty array when given undefined', () => {
    expect(groupAuditLogsByDate(undefined as unknown as AuditLog[])).toEqual([])
  })

  it('groups logs by ISO date and preserves original fields', () => {
    const logs: AuditLog[] = [
      { timestamp: '2024-01-15T10:30:00Z', user_id: 'u1', action: 'login' },
      { timestamp: '2024-01-15T14:00:00Z', user_id: 'u2', action: 'logout' },
      { timestamp: '2024-01-16T09:00:00Z', user_id: 'u3', action: 'update' },
    ]
    const result = groupAuditLogsByDate(logs) as GroupedAuditLog[]

    expect(result).toHaveLength(2)

    expect(result[0].date).toBe('2024-01-15')
    expect(result[0].items).toHaveLength(2)
    expect(result[0].items[0]).toEqual({
      timestamp: '2024-01-15T10:30:00Z',
      user_id: 'u1',
      action: 'login',
    })
    expect(result[0].items[1]).toEqual({
      timestamp: '2024-01-15T14:00:00Z',
      user_id: 'u2',
      action: 'logout',
    })

    expect(result[1].date).toBe('2024-01-16')
    expect(result[1].items).toHaveLength(1)
    expect(result[1].items[0]).toEqual({
      timestamp: '2024-01-16T09:00:00Z',
      user_id: 'u3',
      action: 'update',
    })
  })

  it('groups logs that share the same object reference', () => {
    const logA: AuditLog = { timestamp: '2024-01-15T10:30:00Z', user_id: 'u1' }
    const logB: AuditLog = { timestamp: '2024-01-15T14:00:00Z', user_id: 'u2' }
    const result = groupAuditLogsByDate([logA, logB]) as GroupedAuditLog[]

    expect(result[0].items[0]).toBe(logA)
    expect(result[0].items[1]).toBe(logB)
  })

  it('places logs with a missing timestamp into an Unknown group', () => {
    const result = groupAuditLogsByDate([{ user_id: 'u1' }]) as GroupedAuditLog[]
    expect(result).toHaveLength(1)
    expect(result[0].date).toBe('Unknown')
    expect(result[0].items).toHaveLength(1)
    expect(result[0].items[0]).toEqual({ user_id: 'u1' })
  })

  it('places logs with an empty timestamp into an Unknown group', () => {
    const result = groupAuditLogsByDate([{ timestamp: '', user_id: 'u1' }]) as GroupedAuditLog[]
    expect(result).toHaveLength(1)
    expect(result[0].date).toBe('Unknown')
    expect(result[0].items[0]).toEqual({ timestamp: '', user_id: 'u1' })
  })

  it('places logs with an invalid/non-ISO timestamp into an Unknown group', () => {
    const result = groupAuditLogsByDate([
      { timestamp: 'not-a-date', user_id: 'u1' },
      { timestamp: '15/01/2024', user_id: 'u2' },
    ]) as GroupedAuditLog[]
    expect(result).toHaveLength(1)
    expect(result[0].date).toBe('Unknown')
    expect(result[0].items).toHaveLength(2)
    expect(result[0].items[0]).toEqual({ timestamp: 'not-a-date', user_id: 'u1' })
    expect(result[0].items[1]).toEqual({ timestamp: '15/01/2024', user_id: 'u2' })
  })

  it('groups unordered input arrays while preserving order within each date group', () => {
    const logs: AuditLog[] = [
      { timestamp: '2024-01-16T09:00:00Z', user_id: 'u3' },
      { timestamp: '2024-01-15T14:00:00Z', user_id: 'u2' },
      { timestamp: '2024-01-16T08:00:00Z', user_id: 'u4' },
      { timestamp: '2024-01-15T10:30:00Z', user_id: 'u1' },
    ]
    const result = groupAuditLogsByDate(logs) as GroupedAuditLog[]

    expect(result).toHaveLength(2)
    expect(result[0].date).toBe('2024-01-15')
    expect(result[0].items.map((item) => item.user_id)).toEqual(['u2', 'u1'])

    expect(result[1].date).toBe('2024-01-16')
    expect(result[1].items.map((item) => item.user_id)).toEqual(['u3', 'u4'])
  })

  it('does not mutate the input array', () => {
    const logs: AuditLog[] = [
      { timestamp: '2024-01-15T10:30:00Z', user_id: 'u1' },
      { timestamp: '2024-01-16T09:00:00Z', user_id: 'u2' },
    ]
    const snapshot = JSON.stringify(logs)
    groupAuditLogsByDate(logs)
    expect(JSON.stringify(logs)).toBe(snapshot)
  })
})
