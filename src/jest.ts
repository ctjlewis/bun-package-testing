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

async function checkPackageJson(packageJsonPath: string): Promise<[string, string] | null> {
  try {
    const packageJsonContent = await readFile(packageJsonPath, "utf-8")
    const packageJson: PackageJson = JSON.parse(packageJsonContent)

    const hasJest = packageJson.scripts && Object.values(packageJson.scripts).some(script => 
      script.toLowerCase().includes("jest")
    )

    if (hasJest && packageJson.homepage?.toLowerCase().includes("github.com")) {
      return [packageJson.name, packageJson.homepage]
    }
  } catch (error) {
    console.warn(`Could not read package.json at ${packageJsonPath}`)
  }

  return null
}

const packagesUsingJestWithGithub: PackageResult = {}

try {
  const modulesDirs = await readdir("./node_modules", { withFileTypes: true })

  for (const dir of modulesDirs) {
    if (dir.isDirectory()) {
      const dirPath = join("./node_modules", dir.name)
        
      if (dir.name.startsWith("@")) {
        // For org packages, descend one level deeper
        const orgDirs = await readdir(dirPath, { withFileTypes: true })
        for (const orgDir of orgDirs) {
          if (orgDir.isDirectory()) {
            const packageJsonPath = join(dirPath, orgDir.name, "package.json")
            const result = await checkPackageJson(packageJsonPath)
            if (result) {
              packagesUsingJestWithGithub[result[0]] = result[1]
            }
          }
        }
      } else {
        // For regular packages
        const packageJsonPath = join(dirPath, "package.json")
        const result = await checkPackageJson(packageJsonPath)
        if (result) {
          packagesUsingJestWithGithub[result[0]] = result[1]
        }
      }
    }
  }

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