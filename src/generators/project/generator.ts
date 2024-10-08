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

  // get project root, create project.json
  const projectRoot = `${options.dir}/${options.name}`;
  addProjectConfiguration(tree, options.name, {
    root: projectRoot,
    projectType: 'application',
    sourceRoot: `${projectRoot}/src`,
    targets: {},
  });

  // Update package.json's workspaces list with this project's directory.
  // This must be done before continuing, so normal fs operations are used
  // rather than NX's tree API.
  const rootPackage = `${tree.root}/package.json`;
  console.log(`Adding project to root package.json (${rootPackage})...`);
  const rootPackageContents = fs.readFileSync(rootPackage, 'utf8')

  try {
    // Append project root to workspaces if not present
    const json = JSON.parse(rootPackageContents);
    json.workspaces = json.workspaces || [];
    if (!json.workspaces.includes(projectRoot)) {
      json.workspaces.push(projectRoot);
      fs.writeFileSync(`${tree.root}/package.json`, JSON.stringify(json, null, 2), 'utf8');
    }
  } catch (err) {
    console.error("Error parsing package.json", err);
  }
  
  var packageManager = "npm"
  if (tree.exists("yarn.lock")) {
    packageManager = "yarn"
  }
  else if (tree.exists("pnpm-lock.yaml")) {
    packageManager = "pnpm"
  }
  console.log(`Selected package manager: ${packageManager}`);

  console.log(`Running roblox-ts template creation for template ${options.projectType}...`);

  // Execute create-roblox-ts creation script
  execSync(`
    sleep 1
    node node_modules/create-roblox-ts/out/index.js \\
      --dir ${projectRoot} \\
      --git false \\
      --eslint true \\
      --prettier false \\
      --vscode false \\
      --packageManager ${packageManager} \\
      --skipBuild \\
      ${options.projectType}
  `, { stdio: 'pipe', encoding: 'utf-8' });

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
