import { frodo, state } from '@rockcarver/frodo-lib';
import { NodeSkeleton } from '@rockcarver/frodo-lib/types/api/NodeApi';
import { SingleTreeExportInterface } from '@rockcarver/frodo-lib/types/ops/JourneyOps';
import fs from 'fs';

import { extractFrConfigDataToFile } from '../utils/Config';
import { printError, printMessage } from '../utils/Console';
import { existScript, realmList, safeFileName } from '../utils/FrConfig';

const { saveJsonToFile, getFilePath } = frodo.utils;
const { exportScript } = frodo.script;
const { exportJourneys, importJourneys } = frodo.authn.journey;
const { DEFAULT_REALM_KEY } = frodo.utils.constants;

/**
 * Export journeys in fr-config-manager format
 * @param {string} name exports only the specifically named journey
 * @param {string} realm exports journeys only in specified realm
 * @param {boolean} pullDependencies include journey dependencies
 * @param {boolean} clean if true clear existing configuration, otherwise false
 * @returns {Promise<boolean>} A promise that resolves to true if successful, false otherwise
 */
export async function configManagerExportJourneys(
  name?: string,
  realm?: string,
  pullDependencies: boolean = false,
  clean: boolean = false
): Promise<boolean> {
  try {
    const realmNames =
      realm && realm !== DEFAULT_REALM_KEY ? [realm] : await realmList();
    for (const realmName of realmNames) {
      if (
        realmName === '/' &&
        state.getDeploymentType() ===
          frodo.utils.constants.CLOUD_DEPLOYMENT_TYPE_KEY
      )
        continue;
      state.setRealm(realmName);
      const exportData = await exportJourneys({
        deps: false,
        useStringArrays: false,
        coords: true,
      });
      await processJourneysExport(
        exportData.trees,
        name,
        pullDependencies,
        clean
      );
    }
    return true;
  } catch (error) {
    printError(error, `Error exporting journeys`);
  }
  return false;
}

/**
 * Helper that processes a journey node for export
 * @param {NodeSkeleton} node the journey node
 * @param {string} displayName the node display name
 * @param {string} nodeDir the node directory
 * @param {string} realmDir the realm directory
 * @param {boolean} pullDependencies include journey dependencies
 * @param {SingleTreeExportInterface} journey the journey export
 */
async function processNodeExport(
  node: NodeSkeleton,
  displayName: string,
  nodeDir: string,
  realmDir: string,
  pullDependencies: boolean,
  journey: SingleTreeExportInterface
) {
  const nodeFileDir = `${nodeDir}/${safeFileName(`${displayName} - ${node._id}`)}`;
  if (node._type?._id === 'PageNode') {
    for (const innerNode of node.nodes) {
      await processNodeExport(
        journey.innerNodes[innerNode._id],
        innerNode.displayName,
        nodeFileDir,
        realmDir,
        pullDependencies,
        journey
      );
    }
  }
  if (
    pullDependencies &&
    journeyNodeNeedsScript(node) &&
    !existScript(node.script, realmDir)
  ) {
    const script = (
      await exportScript(node.script, {
        deps: false,
        includeDefault: true,
        useStringArrays: false,
      })
    ).script[node.script];
    const scriptsDir = `realms/${realmDir}/scripts/`;
    script.script = extractFrConfigDataToFile(
      script.script,
      `scripts-content/${script.context}/${script.name}.js`,
      scriptsDir
    ) as any;
    saveJsonToFile(
      script,
      getFilePath(`${scriptsDir}scripts-config/${script._id}.json`, true),
      false,
      true,
      true
    );
  }
  saveJsonToFile(
    node,
    getFilePath(`${nodeFileDir}.json`, true),
    false,
    true,
    true
  );
}

/**
 * Helper that processes journeys for export
 * @param {Record<string, SingleTreeExportInterface>} journeys The journeys to process
 * @param {string} name processes only the specifically named journey
 * @param {boolean} pullDependencies include journey dependencies
 * @param {boolean} clean if true clear existing configuration, otherwise false
 */
async function processJourneysExport(
  journeys: Record<string, SingleTreeExportInterface>,
  name?: string,
  pullDependencies: boolean = false,
  clean: boolean = false
): Promise<void> {
  const realmDir = state.getRealm() === '/' ? 'root' : state.getRealm();
  for (const [treeId, journey] of Object.entries(journeys)) {
    if (name && treeId !== name) {
      continue;
    }
    const journeyDir = `realms/${realmDir}/journeys/${treeId}`;
    const nodeDir = `${journeyDir}/nodes`;
    if (clean) {
      fs.rmSync(nodeDir, { recursive: true, force: true });
    }
    if (!fs.existsSync(nodeDir)) {
      fs.mkdirSync(nodeDir, { recursive: true });
    }
    for (const node of Object.values(journey.nodes)) {
      if (
        name &&
        pullDependencies &&
        node._type._id === 'InnerTreeEvaluatorNode'
      ) {
        await processJourneysExport(
          journeys,
          node.tree,
          pullDependencies,
          clean
        );
      }
      await processNodeExport(
        node,
        journey.tree.nodes[node._id].displayName,
        nodeDir,
        realmDir,
        pullDependencies,
        journey
      );
    }
    saveJsonToFile(
      journey.tree,
      getFilePath(`${journeyDir}/${journey.tree._id}.json`, true),
      false,
      true,
      true
    );
  }
}

function journeyNodeNeedsScript(node) {
  return (
    // eslint-disable-next-line no-prototype-builtins
    node.hasOwnProperty('script') &&
    // eslint-disable-next-line no-prototype-builtins
    (!node.hasOwnProperty('useScript') || node.useScript)
  );
}

/**
 * Read a script by id from the fr-config-manager scripts directory, inlining its content
 * @param {string} scriptId the script _id referenced by a node
 * @param {string} realmDir on-disk realm directory name
 * @returns the script object, or null if not found
 */
function readScriptById(scriptId: string, realmDir: string): any | null {
  const baseDir = getFilePath(`realms/${realmDir}/scripts`);
  const scriptConfigFile = `${baseDir}/scripts-config/${scriptId}.json`;
  if (!fs.existsSync(scriptConfigFile)) {
    printMessage(`Script config not found: ${scriptConfigFile}`, 'error');
    return null;
  }

  const script = JSON.parse(fs.readFileSync(scriptConfigFile, 'utf8'));

  // export replaces content with a { file: ... } reference relative to baseDir
  if (script.script?.file) {
    const contentFile = `${baseDir}/${script.script.file}`;
    if (!fs.existsSync(contentFile)) {
      printMessage(`Script content not found: ${contentFile}`, 'error');
      return null;
    }
    script.script = fs.readFileSync(contentFile, 'utf8').split('\n');
  }

  return script;
}

/**
 * Process a journey directory for configManagerImportJourneys
 * @param {string} journeyDir path to the journey directory
 * @param {string} journeyName name of the journey
 * @param {boolean} dependencies if true, recursively include inner tree dependencies
 * @param {string} journeysBaseDir base directory containing all journeys for the realm
 * @param {string} processedJourneys set of already-processed journey names to prevent circular references
 * @returns map of journey names to their import data
 */
function processJourneyImport(
  journeyDir: string,
  journeyName: string,
  pushInnerJourneys: boolean,
  pushScripts: boolean,
  dependencies: boolean,
  journeysBaseDir: string,
  realmDir: string,
  processedJourneys: Set<string> = new Set()
): Record<string, any> {
  if (processedJourneys.has(journeyName)) {
    return {};
  }
  const addScript = (node: any) => {
    if (!dependencies || !journeyNodeNeedsScript(node)) return;
    if (!node.script || node.script === '[Empty]') return;
    if (journeyData.scripts[node.script]) return;
    const script = readScriptById(node.script, realmDir);
    if (script) journeyData.scripts[script._id] = script;
  };
  processedJourneys.add(journeyName);

  const treeJsonPath = `${journeyDir}/${journeyName}.json`;
  const treeData = fs.readFileSync(treeJsonPath, 'utf8');
  const tree = JSON.parse(treeData);

  const journeyData = {
    circlesOfTrust: {},
    emailTemplates: {},
    innerNodes: {},
    nodes: {},
    saml2Entities: {},
    scripts: {},
    socialIdentityProviders: {},
    themes: [],
    tree,
    variable: {},
  };

  const innerTreeNames: string[] = [];

  const nodesDir = `${journeyDir}/nodes`;
  if (fs.existsSync(nodesDir)) {
    const entries = fs.readdirSync(nodesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        const node = JSON.parse(
          fs.readFileSync(`${nodesDir}/${entry.name}`, 'utf8')
        );
        journeyData.nodes[node._id] = node;

        if (dependencies && node._type?._id === 'InnerTreeEvaluatorNode') {
          innerTreeNames.push(node.tree);
        } else {
          addScript(node);
        }
      }

      if (entry.isDirectory()) {
        const pageNodeDir = `${nodesDir}/${entry.name}`;
        const innerFiles = fs.readdirSync(pageNodeDir);
        for (const innerFile of innerFiles) {
          if (!innerFile.endsWith('.json')) continue;
          const innerData = fs.readFileSync(
            `${pageNodeDir}/${innerFile}`,
            'utf8'
          );
          const innerNode = JSON.parse(innerData);
          journeyData.innerNodes[innerNode._id] = innerNode;
          addScript(innerNode);
        }
      }
    }
  }

  const trees: Record<string, any> = {
    [journeyName]: journeyData,
  };

  if (dependencies) {
    for (const innerTreeName of innerTreeNames) {
      const innerJourneyDir = `${journeysBaseDir}/${innerTreeName}`;

      const innerTrees = processJourneyImport(
        innerJourneyDir,
        innerTreeName,
        pushInnerJourneys,
        pushScripts,
        dependencies,
        journeysBaseDir,
        realmDir,
        processedJourneys
      );
      Object.assign(trees, innerTrees);
    }
  }

  return trees;
}

/**
 * Import journeys from fr-config-manager file structure
 * @param name optional journey name to import
 * @param realm optional realm to import to
 * @param dependencies if true, push inner tree dependencies
 * @returns true if successful, false otherwise
 */
export async function configManagerImportJourneys(
  name?: string,
  realm?: string,
  dependencies?: boolean
): Promise<boolean> {
  try {
    const pushInnerJourneys = !name || (dependencies ?? false);
    const pushScripts = dependencies ?? false;
    const options = { deps: dependencies ?? false, reUuid: false };

    const realmsDir = getFilePath('realms');
    if (!fs.existsSync(realmsDir)) {
      printMessage('No journey files found to import.', 'error');
      return false;
    }

    const realmDirs = fs
      .readdirSync(realmsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    let imported = false;

    for (const realmDir of realmDirs) {
      state.setRealm(realmDir === 'root' ? '/' : realmDir);

      if (
        (state.getRealm() === '/' &&
          state.getDeploymentType() ===
            frodo.utils.constants.CLOUD_DEPLOYMENT_TYPE_KEY) ||
        (realm !== DEFAULT_REALM_KEY && state.getRealm() !== realm)
      )
        continue;

      const journeysBaseDir = `${realmsDir}/${realmDir}/journeys`;
      if (!fs.existsSync(journeysBaseDir)) continue;

      const journeyNames = name
        ? [name]
        : fs
            .readdirSync(journeysBaseDir, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);

      const trees: Record<string, any> = {};
      const processed = new Set<string>();

      for (const journeyName of journeyNames) {
        const journeyDir = `${journeysBaseDir}/${journeyName}`;
        if (!fs.existsSync(journeyDir)) continue;

        Object.assign(
          trees,
          processJourneyImport(
            journeyDir,
            journeyName,
            pushInnerJourneys,
            pushScripts,
            dependencies ?? false,
            journeysBaseDir,
            realmDir,
            processed
          )
        );
      }

      if (Object.keys(trees).length) {
        await importJourneys({ trees }, options);
        imported = true;
      }
    }

    if (!imported) {
      printMessage('No journey files found to import.', 'error');
      return false;
    }

    return true;
  } catch (error) {
    printError(error, `Error importing journeys`);
  }
  return false;
}
