import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { projectGenerator } from './generator';
import { PlaceGeneratorSchema } from './schema';

describe('place generator', () => {
  let tree: Tree;
  const options: PlaceGeneratorSchema = {
    name: 'test',
    projectType: 'place',
    dir: 'tmp'
  };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await projectGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });
});
