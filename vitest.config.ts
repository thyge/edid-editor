import { defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default defineConfig({
  ...viteConfig,
  test: {
    globals: true,
    environment: 'node',
    // Keep the default excludes and also skip git worktree checkouts under
    // .worktrees/, otherwise a stray worktree doubles the discovered test
    // files (its own copy of the suite is scanned from the repo root).
    exclude: [...configDefaults.exclude, '**/.worktrees/**'],
  },
})
