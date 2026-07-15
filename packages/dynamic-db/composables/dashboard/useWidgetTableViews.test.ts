import { describe, it, expect, vi, beforeEach } from 'vitest'
import { newClientApi } from 'api'
import { useWidgetTableViews } from './useWidgetTableViews'

const getConfigMock = newClientApi.getDocpalMasterTableUserConfig as unknown as ReturnType<typeof vi.fn>

function mockConfig(views: any[]) {
  getConfigMock.mockResolvedValue({
    data: { tableConfig: JSON.stringify(views), tableFields: [] }
  })
}

describe('useWidgetTableViews', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty list and skips the API call when tableId is empty', async () => {
    const { views, loadViews } = useWidgetTableViews()
    await loadViews('')
    expect(views.value).toEqual([])
    expect(getConfigMock).not.toHaveBeenCalled()
  })

  it('parses tableConfig and keeps only table views (including legacy views without a type)', async () => {
    mockConfig([
      { id: 'tv_1', name: 'All records', type: 'table', columns: [] },
      { id: 'tv_2', name: 'Board', type: 'kanban', columns: [] },
      { id: 'tv_3', name: 'Legacy table', columns: [] }
    ])
    const { views, loadViews } = useWidgetTableViews()
    await loadViews('table-1')
    expect(getConfigMock).toHaveBeenCalledWith({ tableId: 'table-1', userId: 'master' })
    expect(views.value.map((v) => v.id)).toEqual(['tv_1', 'tv_3'])
  })

  it('returns empty list and clears loading when the API fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    getConfigMock.mockRejectedValue(new Error('boom'))
    const { views, viewsLoading, loadViews } = useWidgetTableViews()
    await loadViews('table-2')
    expect(views.value).toEqual([])
    expect(viewsLoading.value).toBe(false)
    consoleSpy.mockRestore()
  })

  it('returns empty list when tableConfig is missing', async () => {
    getConfigMock.mockResolvedValue({ data: {} })
    const { views, loadViews } = useWidgetTableViews()
    await loadViews('table-3')
    expect(views.value).toEqual([])
  })

  it('discards a stale response when a newer loadViews supersedes an in-flight one', async () => {
    let resolveA!: (v: any) => void
    let resolveB!: (v: any) => void
    const promiseA = new Promise((r) => (resolveA = r))
    const promiseB = new Promise((r) => (resolveB = r))
    getConfigMock.mockReturnValueOnce(promiseA).mockReturnValueOnce(promiseB)

    const { views, viewsLoading, loadViews } = useWidgetTableViews()
    const callA = loadViews('table-A')
    expect(viewsLoading.value).toBe(true)
    const callB = loadViews('table-B')

    // Newer request resolves first
    resolveB({
      data: { tableConfig: JSON.stringify([{ id: 'tv_b', name: 'B', type: 'table', columns: [] }]) }
    })
    await callB
    expect(views.value.map((v) => v.id)).toEqual(['tv_b'])
    expect(viewsLoading.value).toBe(false)

    // Stale response resolves last — must be discarded
    resolveA({
      data: { tableConfig: JSON.stringify([{ id: 'tv_a', name: 'A', type: 'table', columns: [] }]) }
    })
    await callA
    expect(views.value.map((v) => v.id)).toEqual(['tv_b'])
    expect(viewsLoading.value).toBe(false)
  })
})
