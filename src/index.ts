import {
  CreateNodesContextV2,
  CreateNodesV2,
  TargetConfiguration,
  createNodesFromFiles,
  joinPathFragments,
} from '@nx/devkit';
import { readdirSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';

// Expected format of the plugin options defined in nx.json
export interface RbxtsPluginOptions {
  buildTargetName?: string;
  devTargetName?: string;
}

// File glob to find all the configuration files for this plugin
const rbxtsConfigGlob = 'package.json';

// Entry function that Nx calls to modify the graph
export const createNodesV2: CreateNodesV2<RbxtsPluginOptions> = [
  rbxtsConfigGlob,
  async (configFiles, options, context) => {
    return await createNodesFromFiles(
      (configFile, options, context) =>
        createNodesInternal(configFile, options, context),
      configFiles,
      options,
      context
    );
  },
];

async function createNodesInternal(
  configFilePath: string,
  options: RbxtsPluginOptions,
  context: CreateNodesContextV2
) {
  const projectRoot = dirname(configFilePath);

  // Do not create a project if rbxts

  // Contents of the astro config file
  const astroConfigContent = readFileSync(
    resolve(context.workspaceRoot, configFilePath)
  ).toString();

  // Read config values using Regex.
  // There are better ways to read config values, but this works for the tutorial
  function getConfigValue(propertyName: string, defaultValue: string) {
    const result = new RegExp(`${propertyName}: '(.*)'`).exec(
      astroConfigContent
    );
    if (result && result[1]) {
      return result[1];
    }
    return defaultValue;
  }

  const srcDir = getConfigValue('srcDir', './src');
  const publicDir = getConfigValue('publicDir', './public');
  const outDir = getConfigValue('outDir', './dist');

  // Inferred task final output
  const buildTarget: TargetConfiguration = {
    command: `astro build`,
    options: { cwd: projectRoot },
    cache: true,
    inputs: [
      '{projectRoot}/astro.config.mjs',
      joinPathFragments('{projectRoot}', srcDir, '**', '*'),
      joinPathFragments('{projectRoot}', publicDir, '**', '*'),
      {
        externalDependencies: ['astro'],
      },
    ],
    outputs: [`{projectRoot}/${outDir}`],
  };
  const devTarget: TargetConfiguration = {
    command: `astro dev`,
    options: { cwd: projectRoot },
  };

  // Project configuration to be merged into the rest of the Nx configuration
  return {
    projects: {
      [projectRoot]: {
        targets: {
          [options.buildTargetName]: buildTarget,
          [options.devTargetName]: devTarget,
        },
      },
    },
  };
}
