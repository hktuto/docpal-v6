import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  captureTableNameMap,
  fetchTableSnapshot,
  guessRelations,
  type TableSnapshot
} from './relationGuesser'
import { newClientApi, postDynamicActions } from 'api'

describe('relationGuesser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('captureTableNameMap', () => {
    it('builds a map of table IDs to names from the menu tree', async () => {
      ;(newClientApi.getDynamicDbMenusTree as any).mockResolvedValue({
        data: [
          {
            item_type: 'master_table',
            item_id: 'tbl-1',
            name: 'Company'
          },
          {
            item_type: 'master_table',
            item_id: 'tbl-2',
            name: 'Contact'
          },
          {
            item_type: 'folder',
            item_id: 'fld-1',
            name: 'Admin',
            children: [
              {
                item_type: 'master_table',
                item_id: 'tbl-3',
                name: 'Sales'
              }
            ]
          }
        ]
      })

      const map = await captureTableNameMap('db-1')
      expect(map.get('tbl-1')).toBe('Company')
      expect(map.get('tbl-2')).toBe('Contact')
      expect(map.get('tbl-3')).toBe('Sales')
      expect(map.has('fld-1')).toBe(false)
    })

    it('falls back to item_id when name is missing', async () => {
      ;(newClientApi.getDynamicDbMenusTree as any).mockResolvedValue({
        data: [
          {
            item_type: 'master_table',
            item_id: 'tbl-x'
          }
        ]
      })

      const map = await captureTableNameMap('db-1')
      expect(map.get('tbl-x')).toBe('tbl-x')
    })

    it('returns empty map on API error', async () => {
      ;(newClientApi.getDynamicDbMenusTree as any).mockRejectedValue(new Error('network'))
      const map = await captureTableNameMap('db-1')
      expect(map.size).toBe(0)
    })
  })

  describe('fetchTableSnapshot', () => {
    it('requests all columns with [{ name: "*" }] and page 0', async () => {
      ;(newClientApi.getDynamicDbTableTableidFields as any).mockResolvedValue({
        data: [{ id: 'f1', field_name: 'company_id', business_type: 'text' }]
      })
      ;(postDynamicActions as any).mockResolvedValue({
        data: {
          data: [{ company_id: 'CP001' }]
        }
      })

      const result = await fetchTableSnapshot('tbl-1', new Map([['tbl-1', 'Company']]))

      expect(postDynamicActions).toHaveBeenCalledWith({
        tableId: 'tbl-1',
        columns: [{ name: '*' }],
        pagination: { pageNum: 0, pageSize: 50 }
      })
      expect(result).not.toBeNull()
      expect(result!.tableName).toBe('Company')
      expect(result!.sampleRows).toEqual([{ company_id: 'CP001' }])
    })

    it('falls back to tableId when nameMap is not provided', async () => {
      ;(newClientApi.getDynamicDbTableTableidFields as any).mockResolvedValue({
        data: []
      })
      ;(postDynamicActions as any).mockResolvedValue({ data: { data: [] } })

      const result = await fetchTableSnapshot('tbl-1')
      expect(result!.tableName).toBe('tbl-1')
    })
  })

  describe('guessRelations', () => {
    it('detects relations based on exact field match + value overlap', () => {
      const source: TableSnapshot = {
        tableId: 'tbl-contact',
        tableName: 'contact',
        fields: [{ id: 'f1', field_name: 'company_id', business_type: 'text' }],
        sampleRows: [{ company_id: 'CP001' }, { company_id: 'CP002' }]
      }
      const target: TableSnapshot = {
        tableId: 'tbl-company',
        tableName: 'company',
        fields: [{ id: 'f2', field_name: 'company_id', business_type: 'text' }],
        sampleRows: [{ company_id: 'CP001' }, { company_id: 'CP002' }, { company_id: 'CP003' }]
      }

      const guesses = guessRelations([source], [target])
      expect(guesses.length).toBeGreaterThan(0)
      expect(guesses[0].sourceTableId).toBe('tbl-contact')
      expect(guesses[0].targetTableId).toBe('tbl-company')
      expect(guesses[0].sourceFieldName).toBe('company_id')
      expect(guesses[0].targetFieldName).toBe('company_id')
      expect(guesses[0].confidence).toBeGreaterThanOrEqual(0.45)
    })

    it('detects relations via ID-suffix + table-name match when no value overlap', () => {
      const source: TableSnapshot = {
        tableId: 'tbl-quotation',
        tableName: 'quotation',
        fields: [{ id: 'f1', field_name: 'case_id', business_type: 'text' }],
        sampleRows: [{ case_id: 'X1' }]
      }
      const target: TableSnapshot = {
        tableId: 'tbl-case',
        tableName: 'case',
        fields: [{ id: 'f2', field_name: 'case_id', business_type: 'text' }],
        sampleRows: [{ case_id: 'Y1' }]
      }

      const guesses = guessRelations([source], [target])
      const guess = guesses.find((g) => g.sourceFieldName === 'case_id' && g.targetFieldName === 'case_id')
      expect(guess).toBeDefined()
      // 0.25 exact + 0.35 id-suffix/table-name + 0.15 table-name-in-field + 0.15 levenshtein + 0.05 type
      expect(guess!.confidence).toBeGreaterThanOrEqual(0.45)
    })

    it('returns empty when no relations meet the threshold', () => {
      const source: TableSnapshot = {
        tableId: 'tbl-a',
        tableName: 'alpha',
        fields: [{ id: 'f1', field_name: 'foo', business_type: 'text' }],
        sampleRows: [{ foo: 'a' }]
      }
      const target: TableSnapshot = {
        tableId: 'tbl-b',
        tableName: 'beta',
        fields: [{ id: 'f2', field_name: 'bar', business_type: 'number' }],
        sampleRows: [{ bar: 99 }]
      }

      const guesses = guessRelations([source], [target])
      expect(guesses.length).toBe(0)
    })

    it('does not compare a table to itself', () => {
      const table: TableSnapshot = {
        tableId: 'tbl-a',
        tableName: 'alpha',
        fields: [{ id: 'f1', field_name: 'id', business_type: 'text' }],
        sampleRows: [{ id: '1' }]
      }

      const guesses = guessRelations([table], [table])
      expect(guesses.length).toBe(0)
    })
  })
})
