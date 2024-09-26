import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { InitGeneratorSchema } from './schema';

export async function initGenerator(tree: Tree, options: InitGeneratorSchema) {
  generateFiles(tree, path.join(__dirname, 'files'), ".", options);
  await formatFiles(tree);
}

export default initGenerator;
