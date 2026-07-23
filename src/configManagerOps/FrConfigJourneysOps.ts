import { frodo, state } from '@rockcarver/frodo-lib';
import {
  MultiTreeExportInterface,
  TreeExportOptions,
} from '@rockcarver/frodo-lib/types/ops/JourneyOps';
import fs from 'fs';

import { extractFrConfigDataToFile } from '../utils/Config';
import { printError, printMessage } from '../utils/Console';
import { existScript, realmList, safeFileName } from '../utils/FrConfig';

const { saveJsonToFile, getFilePath } = frodo.utils;
const { exportJourneys, importJourneys } = frodo.authn.journey;
const { DEFAULT_REALM_KEY } = frodo.utils.constants;

export async function configManagerExportJourneys(
  name?,
  realm?,
  pullDependency?
  // TO DO: clean?
): Promise<boolean> {
  const options: TreeExportOptions = {
    deps: pullDependency,
    useStringArrays: true,
    coords: true,
  };

  try {
    const realmNames =
      realm && realm !== DEFAULT_REALM_KEY ? [realm] : await realmList();

    for (const realmName of realmNames) {
      if (
        realmName === '/ ' &&
        state.getDeploymentType() ===
          frodo.utils.constants.CLOUD_DEPLOYMENT_TYPE_KEY
      )
        continue;

      state.setRealm(realmName);

      const exportData = (await exportJourneys(
        options
      )) as MultiTreeExportInterface;
      await processJourneysExport(
        exportData.trees,
        name,
        pullDependency,
        'realms'
      );
    }
    return true;
  } catch (error) {
    printError(error, `Error exporting config entity endpoints`);
  }
  return false;
}

function matchJourneyName(journey, name) {
  return journey.tree._id === name;
}

function fileNameFromNode(displayName, id) {
  return safeFileName(`${displayName} - ${id}`);
}

async function processJourneysExport(
  journeys,
  name,
  pullDependencies,
  exportDir
) {
  const realmDir = state.getRealm() === '/' ? 'root' : state.getRealm();
  const fileDir = `${exportDir}/${realmDir}/journeys`;
  try {
    for (const [, journey] of Object.entries(journeys) as [string, any]) {
      if (name && !matchJourneyName(journey, name)) {
        continue;
      }

      const journeyDir = `${fileDir}/${journey.tree._id}`;
      const nodeDir = `${journeyDir}/nodes`;
      const scriptJsonDir = `realms/${realmDir}/scripts/scripts-config`;

      for (const [nodeId, node] of Object.entries(journey.nodes) as [
        string,
        any,
      ]) {
        const nodeFileNameRoot = `${nodeDir}/${fileNameFromNode(journey.tree.nodes[nodeId].displayName, nodeId)}`;

        if (node._type._id === 'PageNode') {
          for (const subNode of node.nodes) {
            const subNodeSpec = journey.innerNodes[subNode._id];

            const subNodeFilename = `${nodeFileNameRoot}/${fileNameFromNode(subNode.displayName, subNode._id)}.json`;
            saveJsonToFile(
              subNodeSpec,
              getFilePath(subNodeFilename, true),
              false,
              true,
              true
            );
            if (
              pullDependencies &&
              journeyNodeNeedsScript(subNodeSpec) &&
              !(await existScript(subNodeSpec.script, realmDir))
            ) {
              const script = journey.scripts[subNodeSpec.script];

              const scriptText = Array.isArray(script.script)
                ? script.script.join('\n')
                : script.script;
              const scriptExtractDir = `realms/${realmDir}/scripts/`;
              const scriptExtractName = `scripts-content/${script.context}/${script.name}.js`;
              extractFrConfigDataToFile(
                scriptText,
                scriptExtractName,
                scriptExtractDir
              );
              script.script = { file: `${scriptExtractName}` };

              saveJsonToFile(
                script,
                getFilePath(`${scriptJsonDir}/${script._id}.json`, true),
                false,
                true,
                true
              );
            }
          }
        } else if (
          pullDependencies &&
          journeyNodeNeedsScript(node) &&
          !(await existScript(node.script, realmDir))
        ) {
          const script = journey.scripts[node.script];
          const scriptText = Array.isArray(script.script)
            ? script.script.join('\n')
            : script.script;
          const scriptExtractDir = `realms/${realmDir}/scripts`;
          const scriptExtractName = `scripts-content/${script.context}/${script.name}.js`;
          extractFrConfigDataToFile(
            scriptText,
            scriptExtractName,
            scriptExtractDir
          );

          script.script = { file: `${scriptExtractName}` };
          saveJsonToFile(
            script,
            getFilePath(`${scriptJsonDir}/${script._id}.json`, true),
            false,
            true,
            true
          );
        } else if (
          !!name &&
          pullDependencies &&
          node._type._id === 'InnerTreeEvaluatorNode'
        ) {
          await processJourneysExport(
            journeys,
            node.tree,
            pullDependencies,
            exportDir
          );
        }

        saveJsonToFile(
          node,
          getFilePath(`${nodeFileNameRoot}.json`, true),
          false,
          true,
          true
        );
      }

      const fileName = `${journeyDir}/${journey.tree._id}.json`;
      saveJsonToFile(
        journey.tree,
        getFilePath(`${fileName}`, true),
        false,
        true,
        true
      );
    }
  } catch (err) {
    printError(err);
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
