import {
  type CreateNodesContextV2,
  type CreateNodesV2,
  type TargetConfiguration,
  createNodesFromFiles,
  joinPathFragments,
} from '@nx/devkit';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

// Expected format of the plugin options defined in nx.json
export interface RobloxPluginOptions {
  buildTargetName: string;
  devTargetName: string;
}

// File glob to find all the configuration files for this plugin
const rbxtsConfigBlob = '**/package.json';

// Entry function that Nx calls to modify the graph
export const createNodesV2: CreateNodesV2<RobloxPluginOptions> = [
  rbxtsConfigBlob,
  async (configFiles, options, context) => {
    return await createNodesFromFiles(
      (configFile, options, context) =>
        {
          return createNodesInternal(configFile, options, context);
        },
      configFiles,
      options,
      context
    );
  },
];

async function createNodesInternal(
  configFilePath: string,
  options: RobloxPluginOptions | undefined,
  context: CreateNodesContextV2
) {
  const projectRoot = dirname(configFilePath);

  // Do not create a project if project options are not defined in nx.json
  if (!options) {
    return {};
  }

  // Do not create a project if package.json or project.json isn't there.
  const siblingFiles = readdirSync(join(context.workspaceRoot, projectRoot));
  if (
    !siblingFiles.includes('package.json') &&
    !siblingFiles.includes('project.json')
  ) {
    return {};
  }

  // Contents of the astro config file
  const rbxtsConfigContent = readFileSync(
    resolve(context.workspaceRoot, configFilePath)
  ).toString();

  // Read config values using Regex.
  // There are better ways to read config values, but this works for the tutorial
  function getConfigValue(propertyName: string, defaultValue: string) {
    const result = new RegExp(`${propertyName}: '(.*)'`).exec(
      rbxtsConfigContent
    );
    if (result?.[1]) {
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
      joinPathFragments('{projectRoot}', srcDir, '**', '*'),
      joinPathFragments('{projectRoot}', publicDir, '**', '*'),
      {
        externalDependencies: ['astro'],
      },
    ],
    outputs: [`{projectRoot}/${outDir}`],
  };
  const devTarget: TargetConfiguration = {
    command: "astro dev",
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
