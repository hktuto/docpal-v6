#!/usr/bin/env node
// Convert demo/all.xlsx into flat JSON files consumed by the Inventory Summary demo widgets.
// Usage (from repo root): node packages/dynamic-db/demo/convert-xlsx.mjs
// NOTE: .mjs is always ESM in Node, so require/__dirname need explicit shims.
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
const XLSX = require('xlsx')
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SRC = path.join(__dirname, 'all.xlsx')
const OUT = path.join(__dirname, 'data')

// Excel serial date -> ISO YYYY-MM-DD (Excel epoch 1899-12-30 == serial 0 offset 25569)
function excelDateToISO(serial) {
  if (typeof serial !== 'number' || !Number.isFinite(serial)) return null
  const ms = Math.round((serial - 25569) * 86400 * 1000)
  return new Date(ms).toISOString().slice(0, 10)
}

function writeJSON(name, data) {
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(data))
  const count = Array.isArray(data) ? data.length : Object.keys(data).length
  console.log(`${name}: ${count} entries`)
}

const wb = XLSX.readFile(SRC)

// ---------- inventory.json ----------
const inventory = XLSX.utils.sheet_to_json(wb.Sheets['inventory']).map((r) => ({
  warehouse: r['Warehouse'],
  brand: r['Brand'],
  parts: r['WCL Parts'],
  subInventory: r['Sub inventory'],
  dateCode: r['Date Code'] != null ? String(r['Date Code']) : '',
  ageDays: Number(r['Age']) || 0,
  onHand: Number(r['OnHand Qty']) || 0,
  reserved: Number(r['Reserved Qty']) || 0,
  available: Number(r['Available Qty']) || 0
}))

// parts -> brand map, authoritative from inventory (some arrival lines have parts
// not present in inventory; those fall back to the prefix before / + - or space)
function partsPrefix(parts) {
  return String(parts).split(/[/+\-\s]/)[0]
}
const brandByParts = {}
for (const row of inventory) {
  if (row.parts && !(row.parts in brandByParts)) brandByParts[row.parts] = row.brand
}
function brandForParts(parts) {
  if (!parts) return 'Unknown'
  if (brandByParts[parts]) return brandByParts[parts]
  return partsPrefix(parts) || 'Unknown'
}

// ---------- transactions.json ----------
const transactions = XLSX.utils.sheet_to_json(wb.Sheets['transaction_log']).map((r) => ({
  warehouse: r['Warehouse'],
  brand: r['Brand'],
  parts: r['WCL Parts'],
  type: r['Type'],
  qty: Number(r['Qty']) || 0,
  date: excelDateToISO(r['Create Date'])
}))

// ---------- arrivals.json (git joined to po_line on PO ID) ----------
const poLines = XLSX.utils.sheet_to_json(wb.Sheets['po_line'])
const linesByPO = {}
for (const l of poLines) {
  const poId = l['PO ID']
  if (!linesByPO[poId]) linesByPO[poId] = []
  linesByPO[poId].push(l)
}

const arrivals = []
for (const g of XLSX.utils.sheet_to_json(wb.Sheets['git'])) {
  const lines = linesByPO[g['PO ID']] || []
  const totalOrdered = lines.reduce((s, l) => s + (Number(l['Ordered Qty']) || 0), 0)
  const qtyShipped = Number(g['qty shipped']) || 0
  // allocate PO-level shipped qty across lines proportionally to ordered qty;
  // running-remainder: round all but the last line, last line takes the rest
  // so per-line sums always equal the PO-level qtyShipped exactly
  let allocatedShipped = 0
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    const ordered = Number(l['Ordered Qty']) || 0
    const lineShipped =
      totalOrdered <= 0
        ? 0
        : i === lines.length - 1
          ? qtyShipped - allocatedShipped
          : Math.round((qtyShipped * ordered) / totalOrdered)
    allocatedShipped += lineShipped
    arrivals.push({
      warehouse: g['Warehouse'],
      brand: brandForParts(l['WCL Parts']),
      parts: l['WCL Parts'],
      poId: g['PO ID'],
      eta: excelDateToISO(g['eta']),
      qtyShipped: lineShipped,
      carrier: g['carrier'],
      trackingNo: g['tracking no'] != null ? String(g['tracking no']) : '',
      status: g['status']
    })
  }
}
arrivals.sort((a, b) => (a.eta < b.eta ? -1 : a.eta > b.eta ? 1 : 0))

// ---------- partCosts.json (unit cost per parts, with fallback chain) ----------
// po_line only covers 354 of 2329 inventory parts, and 18 of 25 brands have no PO
// cost data at all. Fallback chain so the Aging Report never shows $0:
//   1. exact: po_line ΣValue / ΣOrderedQty for that parts
//   2. brand average of costed parts
//   3. global average unit cost (~$1.10)
const costAgg = {}
for (const l of poLines) {
  const parts = l['WCL Parts']
  if (!parts) continue
  if (!costAgg[parts]) costAgg[parts] = { value: 0, qty: 0 }
  costAgg[parts].value += Number(l['Value']) || 0
  costAgg[parts].qty += Number(l['Ordered Qty']) || 0
}
const exactCost = {}
let totalValue = 0
let totalQty = 0
for (const [parts, agg] of Object.entries(costAgg)) {
  if (agg.qty <= 0) continue
  totalValue += agg.value
  totalQty += agg.qty
  exactCost[parts] = agg.value / agg.qty
}
const globalAvgCost = totalQty > 0 ? totalValue / totalQty : 0

const brandAgg = {}
for (const [parts, c] of Object.entries(exactCost)) {
  const brand = brandByParts[parts] || partsPrefix(parts)
  if (!brandAgg[brand]) brandAgg[brand] = { sum: 0, n: 0 }
  brandAgg[brand].sum += c
  brandAgg[brand].n++
}
const brandAvgCost = {}
for (const [brand, agg] of Object.entries(brandAgg)) {
  brandAvgCost[brand] = agg.sum / agg.n
}

// Emit a cost for every distinct inventory part
const partCosts = {}
for (const row of inventory) {
  if (!row.parts || row.parts in partCosts) continue
  partCosts[row.parts] = exactCost[row.parts] ?? brandAvgCost[row.brand] ?? globalAvgCost
}

fs.mkdirSync(OUT, { recursive: true })
writeJSON('inventory.json', inventory)
writeJSON('transactions.json', transactions)
writeJSON('arrivals.json', arrivals)
writeJSON('partCosts.json', partCosts)
