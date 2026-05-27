#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const baseDir = __dirname
const csvPath = path.join(baseDir, 'PNP ID Registry.csv')
const outPath = path.join(baseDir, 'pnp-registry.ts')

const csv = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '')
const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0)
if (lines.length <= 1) {
  throw new Error('PNP ID Registry CSV does not contain any data rows')
}

function parseCsvLine(line) {
  const values = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
      continue
    }

    current += char
  }

  values.push(current)
  return values
}

const seen = new Set()
const entries = []

for (const line of lines.slice(1)) {
  const [companyRaw, idRaw, approvedRaw] = parseCsvLine(line)
  const id = (idRaw ?? '').trim().toUpperCase()
  if (!id || id === 'PNP ID' || seen.has(id)) continue
  seen.add(id)
  const company = (companyRaw ?? '').trim()
  const approvedOn = ((approvedRaw ?? '').trim()) || null
  entries.push({ id, company, approvedOn })
}

const encodeString = (value) => JSON.stringify(value)
const entryLines = entries
  .map(({ id, company, approvedOn }) => {
    const approvedLiteral = approvedOn ? encodeString(approvedOn) : 'null'
    return `  { id: ${encodeString(id)}, company: ${encodeString(company)}, approvedOn: ${approvedLiteral} },`
  })
  .join('\n')

const today = new Date().toISOString().split('T')[0]
const fileHeader = `/**\n * Auto-generated from PNP ID Registry.csv on ${today}.\n * Do not edit manually. Update the CSV and rerun src/common/generate-pnp-registry.cjs\n */`

const fileBody = `${fileHeader}\n\nexport interface ManufacturerRegistryEntry {\n  id: string\n  company: string\n  approvedOn: string | null\n}\n\nexport const PNP_REGISTRY_ENTRIES = [\n${entryLines}\n] as const satisfies readonly ManufacturerRegistryEntry[]\n\nconst manufacturerRegistry: Map<string, ManufacturerRegistryEntry> = new Map(\n  PNP_REGISTRY_ENTRIES.map((entry) => [entry.id, entry])\n)\n\nexport function getManufacturerInfo(pnpId: string | null | undefined): ManufacturerRegistryEntry | null {\n  if (!pnpId) return null\n  const normalized = pnpId.trim().toUpperCase()\n  if (!normalized) return null\n  return manufacturerRegistry.get(normalized) ?? null\n}\n\nexport function getManufacturerName(pnpId: string | null | undefined): string | null {\n  return getManufacturerInfo(pnpId)?.company ?? null\n}\n`

fs.writeFileSync(outPath, fileBody)
console.log(`Wrote ${entries.length} manufacturers to ${path.relative(process.cwd(), outPath)}`)
