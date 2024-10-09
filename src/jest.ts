import { readdir, readFile } from "fs/promises"
import { join } from "path"

interface PackageJson {
  name: string;
  scripts?: Record<string, string>;
  homepage?: string;
}

interface PackageResult {
  [packageName: string]: string;
}

function normalizeGitHubUrl(url: string): string | null {
  // Remove any fragment identifier (#...)
  url = url.split("#")[0]
  
  const githubRegex = /https?:\/\/github\.com\/([^\/]+)\/([^\/]+)/
  const match = url.match(githubRegex)
  if (match) {
    const [, user, repo] = match
    // Remove any .git extension if present
    const cleanRepo = repo.endsWith(".git") ? repo.slice(0, -4) : repo
    return `https://github.com/${user}/${cleanRepo}.git`
  }
  return null
}


async function checkPackageJson(packageJsonPath: string): Promise<{ name: string; githubUrl: string } | null> {
  try {
    const packageJsonContent = await readFile(packageJsonPath, "utf-8")
    const packageJson: PackageJson = JSON.parse(packageJsonContent)

    const hasJest = packageJson.scripts && Object.values(packageJson.scripts).some(script => 
      script.toLowerCase().includes("jest")
    )

    if (hasJest && packageJson.homepage) {
      const normalizedUrl = normalizeGitHubUrl(packageJson.homepage)
      if (normalizedUrl) {
        return { name: packageJson.name, githubUrl: normalizedUrl }
      }
    }
  } catch (error) {
    console.warn(`Could not read package.json at ${packageJsonPath}`)
  }

  return null
}

const packagesUsingJestWithGithub: PackageResult = {}

async function scanDirectory(dirPath: string) {
  const entries = await readdir(dirPath, { withFileTypes: true })
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = join(dirPath, entry.name)
      
      if (entry.name.startsWith("@")) {
        // For org packages, only descend into subdirectories
        await scanDirectory(fullPath)
      } else {
        // For regular packages or subdirectories of org packages
        const packageJsonPath = join(fullPath, "package.json")
        const result = await checkPackageJson(packageJsonPath)
        if (result) {
          const { name, githubUrl } = result
          packagesUsingJestWithGithub[name] = githubUrl
        }
      }
    }
  }
}

try {
  await scanDirectory("./node_modules")

  console.log("Packages using Jest and have a GitHub homepage:")
  console.log(JSON.stringify(packagesUsingJestWithGithub, null, 2))
  console.log(`Total: ${Object.keys(packagesUsingJestWithGithub).length} packages`)

  // Save the list to a file
  await Bun.write(
    Bun.file("./dependencies-jest-github.json"),
    JSON.stringify(packagesUsingJestWithGithub, null, 2)
  )

  console.log("List saved to dependencies-jest-github.json")
} catch (error) {
  console.error("An error occurred:", error)
}