import { readFile } from "fs/promises"

// Define the type for our package data
type PackageData = string[];

// Function to parse the markdown content
function parseMarkdown(content: string): PackageData {
  const packageRegex = /^\d+\.\s\[([^\]]+)\]/gm
  const matches = content.matchAll(packageRegex)
  return Array.from(matches, match => match[1])
}

// Read the markdown file
const markdownContent = await readFile("./npmrank.md", "utf-8")

// Parse the markdown content
const packages: PackageData = parseMarkdown(markdownContent)

// Write the JSON file
await Bun.write(
  Bun.file("./dependencies.json"),
  JSON.stringify(packages, null, 2)
)

console.log("Dependencies saved to ./dependencies.json")