import { readFile } from 'fs/promises';

interface PackageJson {
  name?: string;
  version?: string;
  dependencies: Record<string, string>;
  [key: string]: any;
}

// Read dependencies.json
const dependenciesContent = await readFile('./dependencies.json', 'utf-8');
const dependencies: string[] = JSON.parse(dependenciesContent);

// Read existing package.json
let packageJson: PackageJson;
try {
  const packageJsonContent = await readFile('./package.json', 'utf-8');
  packageJson = JSON.parse(packageJsonContent);
} catch (error) {
  // If package.json doesn't exist, create a new object
  packageJson = { dependencies: {} };
}

// Ensure dependencies object exists
if (!packageJson.dependencies) {
  packageJson.dependencies = {};
}

// Add dependencies to package.json
for (const dep of dependencies) {
  if (dep.includes("firebase")) {
    continue;
  }
  packageJson.dependencies[dep] = "latest";
}

// Write updated package.json
await Bun.write(
  Bun.file("./package.json"),
  JSON.stringify(packageJson, null, 2)
);

console.log("package.json has been updated with the new dependencies.");

console.log(`Running: bun i`);
await Bun.$`bun i`;