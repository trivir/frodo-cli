import { frodo, state } from '@rockcarver/frodo-lib';
import {
  MultiTreeExportInterface,
  TreeExportOptions,
} from '@rockcarver/frodo-lib/types/ops/JourneyOps';
import fs from 'fs';

import { extractFrConfigDataToFile } from '../utils/Config';
import { printError, verboseMessage } from '../utils/Console';
import { existScript, realmList, safeFileName } from '../utils/FrConfig';

const { readRealms } = frodo.realm;

const { saveJsonToFile, getFilePath } = frodo.utils;
const { exportJourneys, importJourneys } = frodo.authn.journey;

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
    if (realm && realm !== '__default__realm__') {
      const exportData = (await exportJourneys(
        options
      )) as MultiTreeExportInterface;
      processJourneys(exportData.trees, realm, name, pullDependency, 'realms');
    } else {
      for (const realm of await realmList()) {
        if (
          realm === '/' &&
          state.getDeploymentType() ===
            frodo.utils.constants.CLOUD_DEPLOYMENT_TYPE_KEY
        )
          continue;

        state.setRealm(realm);
        const exportData = (await exportJourneys(
          options
        )) as MultiTreeExportInterface;
        await processJourneys(
          exportData.trees,
          realm,
          name,
          pullDependency,
          'realms'
        );
      }
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

async function processJourneys(
  journeys,
  realm,
  name,
  pullDependencies,
  exportDir
) {
  const fileDir = `${exportDir}/${realm}/journeys`;
  try {
    for (const [, journey] of Object.entries(journeys) as [string, any]) {
      if (name && !matchJourneyName(journey, name)) {
        continue;
      }
      const journeyDir = `${fileDir}/${journey.tree._id}`;
      const nodeDir = `${journeyDir}/nodes`;
      const scriptJsonDir = `realms/${realm}/scripts/scripts-config`;

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
              !(await existScript(subNodeSpec.script, realm))
            ) {
              const script = journey.scripts[subNodeSpec.script];

              const scriptText = Array.isArray(script.script)
                ? script.script.join('\n')
                : script.script;
              const scriptExtractDir = `realms/${realm}/scripts/`;
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
          !(await existScript(node.script, realm))
        ) {
          verboseMessage('Trying to save the script on the node');
          verboseMessage(nodeId);
          verboseMessage(node.script);

          const script = journey.scripts[node.script];
          const scriptText = Array.isArray(script.script)
            ? script.script.join('\n')
            : script.script;
          const scriptExtractDir = `realms/${realm}/scripts`;
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
          await processJourneys(
            journeys,
            realm,
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
 * Process a journey directory for configManagerImportJourneys 
 * @param journeyDir path to the journey directory
 * @param journeyName name of the journey
 * @param dependencies if true, recursively include inner tree dependencies
 * @param journeysBaseDir base directory containing all journeys for the realm
 * @param processedJourneys set of already-processed journey names to prevent circular references
 * @returns map of journey names to their import data
 */
function processJourney(
  journeyDir: string,
  journeyName: string,
  dependencies: boolean,
  journeysBaseDir: string,
  processedJourneys: Set<string> = new Set()
): Record<string, any> {
  if (processedJourneys.has(journeyName)) {
    return {};
  }
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
        const nodeData = fs.readFileSync(`${nodesDir}/${entry.name}`, 'utf8');
        const node = JSON.parse(nodeData);
        journeyData.nodes[node._id] = node;

        if (dependencies && node._type?._id === 'InnerTreeEvaluatorNode') {
          innerTreeNames.push(node.tree);
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

      const innerTrees = processJourney(
        innerJourneyDir,
        innerTreeName,
        dependencies,
        journeysBaseDir,
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
    if (realm === '/' || realm === '__default__realm__') {
      return true;
    }

    const options = { deps: dependencies ?? false, reUuid: false };

    if (realm) {
      const journeysBaseDir = getFilePath(`realms/${realm}/journeys`);

      if (name) {
        const journeyDir = `${journeysBaseDir}/${name}`;
        const trees = processJourney(
          journeyDir,
          name,
          dependencies ?? false,
          journeysBaseDir
        );
        await importJourneys({ trees }, options);
      } else {
        const journeyDirs = fs
          .readdirSync(journeysBaseDir, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => dirent.name);

        const trees: Record<string, any> = {};
        const processed = new Set<string>();
        for (const journeyName of journeyDirs) {
          const journeyDir = `${journeysBaseDir}/${journeyName}`;
          const journeyTrees = processJourney(
            journeyDir,
            journeyName,
            dependencies ?? false,
            journeysBaseDir,
            processed
          );
          Object.assign(trees, journeyTrees);
        }
        await importJourneys({ trees }, options);
      }
    } else if (name) {
      const readRealmNames = await readRealms();
      for (const realmName of readRealmNames) {
        if (realmName.name === '/' || realmName.name === '__default__realm__')
          continue;
        state.setRealm(realmName.name);

        const journeysDir = getFilePath(
          `realms${realmName.parentPath + realmName.name}/journeys`
        );
        if (!fs.existsSync(journeysDir)) continue;

        const journeyDir = `${journeysDir}/${name}`;
        if (!fs.existsSync(journeyDir)) continue;

        const trees = processJourney(
          journeyDir,
          name,
          dependencies ?? false,
          journeysDir
        );
        await importJourneys({ trees }, options);
      }
    } else {
      const readRealmNames = await readRealms();
      for (const realmName of readRealmNames) {
        if (realmName.name === '/' || realmName.name === '__default__realm__')
          continue;
        state.setRealm(realmName.name);

        const journeysDir = getFilePath(
          `realms${realmName.parentPath + realmName.name}/journeys`
        );
        if (!fs.existsSync(journeysDir)) continue;

        const journeyDirs = fs
          .readdirSync(journeysDir, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => dirent.name);

        const trees: Record<string, any> = {};
        const processed = new Set<string>();
        for (const journeyName of journeyDirs) {
          const journeyDir = `${journeysDir}/${journeyName}`;
          const journeyTrees = processJourney(
            journeyDir,
            journeyName,
            dependencies ?? false,
            journeysDir,
            processed
          );
          Object.assign(trees, journeyTrees);
        }
        await importJourneys({ trees }, options);
      }
    }

    return true;
  } catch (error) {
    printError(error, `Error importing journeys`);
  }
  return false;
}
