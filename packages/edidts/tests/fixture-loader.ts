import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as basicFixtures from './fixtures'

export interface EdidFixtureCase {
  name: string
  data: Uint8Array
  source: 'fixtures' | 'fixtures_proprietary'
}

type FixtureModule = Record<string, unknown>

const currentDir = dirname(fileURLToPath(import.meta.url))
const proprietaryFixturePath = join(currentDir, 'fixtures_proprietary.ts')
const edidSignature = [0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00]

function isFullEdid(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array
    && value.length >= 128
    && edidSignature.every((byte, index) => value[index] === byte)
}

export function collectEdidFixturesFromModule(
  module: FixtureModule,
  source: EdidFixtureCase['source'] = 'fixtures',
): EdidFixtureCase[] {
  return Object.entries(module)
    .filter(([, value]) => isFullEdid(value))
    .map(([name, data]) => ({
      name,
      data: data as Uint8Array,
      source,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function loadEdidFixtures(): Promise<EdidFixtureCase[]> {
  if (existsSync(proprietaryFixturePath)) {
    const proprietaryFixtures = await import(pathToFileURL(proprietaryFixturePath).href)
    const proprietaryCases = collectEdidFixturesFromModule(
      proprietaryFixtures as FixtureModule,
      'fixtures_proprietary',
    )

    if (proprietaryCases.length > 0) {
      return proprietaryCases
    }
  }

  return collectEdidFixturesFromModule(basicFixtures as FixtureModule, 'fixtures')
}
