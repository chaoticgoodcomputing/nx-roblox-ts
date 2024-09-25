import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  readJson,
  writeJson,
  updateJson,
  Tree,
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
  
  // Package manager hard-set to npm, since it appears Yarn 2+ and PNPM may have
  // behavior when used in a monorepo context that would be tricky to determine
  // from inside the package context.
  //
  // This is somewhat mitigated by the fact that node_modules is deleted after
  // the installation occurs, allowing the user to use their preferred package
  // manager.
  var packageManager = "npm";

  const command = `
    node node_modules/create-roblox-ts/out/index.js \\
      --dir ${projectRoot} \\
      --git false \\
      --eslint true \\
      --prettier false \\
      --vscode true \\
      --packageManager ${packageManager} \\
      --skipBuild \\
      place
  `;

  // Execute commands
  try {
    execSync(command, { stdio: 'pipe', encoding: 'utf-8' });
  } catch (error) {
    console.error('Error executing command:', error);
    return error.stdout;
  }

  // TODO: Find some way to prevent the project from installing node_modules.
  tree.delete(`${projectRoot}/node_modules`);
  tree.delete(`${projectRoot}/package-lock.json`);
  tree.rename(
    `${projectRoot}/default.project.json`,
    `${projectRoot}/default.rojo.json`
  )

  await formatFiles(tree);
}

export default projectGenerator;
