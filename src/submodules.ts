import { readFile } from "fs/promises"
import { join } from "path"

interface PackageResult {
  [packageName: string]: string;
}

try {
  // Read the dependencies-jest-github.json file
  const dependenciesContent = await readFile("./dependencies-jest-github.json", "utf-8")
  const dependencies: PackageResult = JSON.parse(dependenciesContent)

  for (const [packageName, homepageUrl] of Object.entries(dependencies)) {
    // Extract the repository name from the homepage URL
    const repoName = homepageUrl.split("/").pop()
    if (!repoName) {
      console.warn(`Could not extract repo name from ${homepageUrl}`)
      continue
    }

    // Construct the submodule path
    const submodulePath = join("./repos", repoName)

    // Add the submodule
    try {
      console.log(`Adding submodule for ${packageName}...`)
      await Bun.$`git submodule add --force ${homepageUrl} ${submodulePath}`
      console.log(`Successfully added submodule for ${packageName}`)
    } catch (error) {
      console.error(`Failed to add submodule for ${packageName}:`, error)
    }
  }

  console.log("Finished adding submodules")
} catch (error) {
  console.error("An error occurred:", error)
}