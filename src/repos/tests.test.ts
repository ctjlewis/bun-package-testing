import { describe, expect, it } from "bun:test"
import { Glob } from "bun"
import { join } from "path"

const reposDir = "./repos"

const skip = ["mini-css-extract-plugin.git"]

function parseTestResults(output = ""): { pass: number; fail: number } {
  const regex = /(\d+)\s+pass[\s\S]*?(\d+)\s+fail/
  const match = output.match(regex)

  if (match) {
    return {
      pass: parseInt(match[1].trim(), 10),
      fail: parseInt(match[2].trim(), 10)
    }
  }

  return { pass: 0, fail: 0 }
}

describe("bun test", () => {
  const glob = new Glob("*")
  const repos = Array.from(glob.scanSync({ cwd: reposDir, onlyFiles: false }))
  repos.sort()

  let i = 0
  for (const repo of repos) {
    it(repo, async (done) => {
      i++
      
      if (skip.includes(repo)) {
        return done("SKIP")
      }
    
      console.log(`Running tests for repo ${i} of ${repos.length}: ${repo}`)
      const repoPath = join(reposDir, repo)
      
      const { exitCode, stderr } = Bun.spawnSync(["bun", "test"], { cwd: repoPath })
      const { pass, fail } = parseTestResults(stderr.toString())
      const percent = ((pass / (pass + fail)) * 100).toFixed(2)
      expect(exitCode, `${percent}% passing`).toBe(0)
      done()
    })
  }
})