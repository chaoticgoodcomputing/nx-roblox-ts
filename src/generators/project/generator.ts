import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  readJson,
  writeJson,
  updateJson,
  Tree,
  writeJsonFile,
} from '@nx/devkit';
import * as path from 'path';
import * as fs from 'fs';
import { PlaceGeneratorSchema as ProjectGeneratorSchema } from './schema';
import { exec, execSync, spawn } from 'child_process';


export async function projectGenerator(
  tree: Tree,
  options: ProjectGeneratorSchema
) {
  const projectRoot = `${options.dir}/${options.name}`;
  addProjectConfiguration(tree, options.name, {
    root: projectRoot,
    projectType: 'application',
    sourceRoot: `${projectRoot}/src`,
    targets: {},
  });

  console.log("Running roblox-ts template creation...");

  // Update package.json with this workspace directory
  const currentPackageJson = readJson(tree, "./package.json");
  if (
    !currentPackageJson.workspaces
    || !currentPackageJson.workspaces.includes(projectRoot)
  ) {
    currentPackageJson.workspaces = [
      ...(currentPackageJson.workspaces || []),
      projectRoot
    ];
    writeJson(tree, "./package.json", currentPackageJson);
  }

  const updatedPackageJson = readJson(tree, `./package.json`);
  if (!updatedPackageJson.workspaces.includes(projectRoot)) {
    throw new Error("Failed to add project to package.json workspaces");
  }
  
  var packageManager = "npm"
  if (tree.exists("yarn.lock")) {
    packageManager = "yarn"
  }
  else if (tree.exists("pnpm-lock.yaml")) {
    packageManager = "pnpm"
  }

  const command = `
    node node_modules/create-roblox-ts/out/index.js \\
      --dir ${projectRoot} \\
      --git false \\
      --eslint true \\
      --prettier false \\
      --vscode false \\
      --packageManager ${packageManager} \\
      --skipBuild \\
      ${options.projectType}
  `;

  // Execute commands
  execSync(command, { stdio: 'pipe', encoding: 'utf-8' });

  // Change name for rojo configuration, since it comes close to conflicting with
  // NX (if not literally then, at the very least, conceptually)
  tree.rename(
    `${projectRoot}/default.project.json`,
    `${projectRoot}/default.rojo.json`
  )

  // Load file overrides
  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, options);

  // Calculate distance between project and root directories
  const rbxtsConfigRelativePath = path.relative(projectRoot, `${tree.root}/tsconfig.rbxts.json`);

  // Update tsconfig.json to inherit from root tsconfig.rbxts.json
  updateJson(tree, `${projectRoot}/tsconfig.json`, (json) => {
    json.extends = rbxtsConfigRelativePath;
    return json;
  });

  // Remove scripts from package.json
  updateJson(tree, `${projectRoot}/package.json`, (json) => {
    json.scripts = {};
    return json;
  });

  await formatFiles(tree);
}

export default projectGenerator;
