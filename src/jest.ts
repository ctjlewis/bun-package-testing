import { readdir, readFile } from "fs/promises"
import { join } from "path"

interface PackageJson {
  name: string;
  scripts?: Record<string, string>;
}

async function checkPackageJson(packageJsonPath: string): Promise<string | null> {
  try {
    const packageJsonContent = await readFile(packageJsonPath, "utf-8")
    const packageJson: PackageJson = JSON.parse(packageJsonContent)

    if (packageJson.scripts) {
      const hasJest = Object.values(packageJson.scripts).some(script => 
        script.toLowerCase().includes("jest")
      )

      if (hasJest) {
        return packageJson.name
      }
    }
  } catch (error) {
    console.warn(`Could not read package.json at ${packageJsonPath}`)
  }

  return null
}

const packagesUsingJest: string[] = []

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
            const packageName = await checkPackageJson(packageJsonPath)
            if (packageName) {
              packagesUsingJest.push(packageName)
            }
          }
        }
      } else {
        // For regular packages
        const packageJsonPath = join(dirPath, "package.json")
        const packageName = await checkPackageJson(packageJsonPath)
        if (packageName) {
          packagesUsingJest.push(packageName)
        }
      }
    }
  }

  console.log("Packages using Jest in their scripts:")
  console.log(packagesUsingJest.join("\n"))
  console.log(`Total: ${packagesUsingJest.length} packages`)

  // Save the list to a file
  await Bun.write(
    Bun.file("./dependencies-using-jest.json"),
    JSON.stringify(packagesUsingJest, null, 2)
  )

  console.log("List saved to dependencies-using-jest.json")
} catch (error) {
  console.error("An error occurred:", error)
}