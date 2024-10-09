import { describe, expect, it } from "bun:test"
import { Glob } from "bun"
import { join } from "path"

const reposDir = "./repos"
const skip = ["mini-css-extract-plugin.git"]

describe("bun install", () => {
  const glob = new Glob("*")
  const repos = Array.from(glob.scanSync({ cwd: reposDir, onlyFiles: false }))

  let i = 0
  for (const repo of repos) {
    if (skip.includes(repo)) {
      i++
      continue
    }

    it(repo, async () => {
      console.log(i++, "of", repos.length)

      const repoPath = join(reposDir, repo)
      const { exitCode } = Bun.spawnSync(["bun", "install"], { cwd: repoPath })
      expect(exitCode).toBe(0)
    })
  }
})