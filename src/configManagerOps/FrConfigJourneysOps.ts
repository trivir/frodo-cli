import { frodo, state } from '@rockcarver/frodo-lib';
import {
  MultiTreeExportInterface,
  TreeExportOptions,
} from '@rockcarver/frodo-lib/types/ops/JourneyOps';

import { extractFrConfigDataToFile } from '../utils/Config';
import { printError, printMessage } from '../utils/Console';

const {
  saveJsonToFile,
  getWorkingDirectory,
  getFilePath,
  findFilesByName,
  sanitize,
} = frodo.utils;
const { readJourneys, exportJourneys } = frodo.authn.journey;
const { readRealms } = frodo.realm;

export async function configManagerExportJourneys(
  name?,
  realm?,
  pullDependency?
  //  clean?
): Promise<boolean> {
  const options: TreeExportOptions = {
    deps: pullDependency,
    useStringArrays: true,
    coords: true,
  };

  try {
    if (realm && realm !== '__default__realm__') {
      const readData = await readJourneys();
      saveJsonToFile(readData, 'readjournyes.json', false, false);
      const exportData = (await exportJourneys(
        options
      )) as MultiTreeExportInterface;
      processJourneys(exportData.trees, realm, name, pullDependency, 'realms');
    } else {
      for (const realm of await realmList()) {
        state.setRealm(realm);
        const exportData = (await exportJourneys(
          options
        )) as MultiTreeExportInterface;
        saveJsonToFile(
          exportData.trees,
          `exportJourneyFor${realm}.json`,
          false,
          false
        );
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

async function realmList(): Promise<string[]> {
  const realms = await readRealms();
  const realmList = [];
  saveJsonToFile(realms, 'realmFile.json', false, false);
  realms.forEach((realmConfig) => {
    realmList.push(`${realmConfig.name}`);
  });
  return realmList;
}

function matchJourneyName(journey, name) {
  return journey._id === name;
}

function fileNameFromNode(displayName, id) {
  return safeFileName(`${displayName} - ${id}`);
}

function safeFileName(filename) {
  return sanitize(filename, {
    replacement: (character) => encodeURIComponent(character),
  });
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
              false
            );
            if (
              pullDependencies &&
              journeyNodeNeedsScript(subNodeSpec) &&
              !(await existScript(subNodeSpec.script, realm))
            ) {
              printMessage(subNodeSpec._id);
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
                false
              );
            }
          }
        } else if (
          pullDependencies &&
          journeyNodeNeedsScript(node) &&
          !(await existScript(node.script, realm))
        ) {
          printMessage('Trying to save the script on the node');
          printMessage(nodeId);
          printMessage(node.script);

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
            false
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
          false
        );
      }

      const fileName = `${journeyDir}/${journey.tree._id}.json`;
      saveJsonToFile(
        journey.tree,
        getFilePath(`${fileName}`, true),
        false,
        false
      );
    }
  } catch (err) {
    printError(err);
  }
}

function journeyNodeNeedsScript(node) {
  return (
    node.hasOwnProperty('script') &&
    (!node.hasOwnProperty('useScript') || node.useScript)
  );
}

async function existScript(fileName, realm): Promise<boolean> {
  await getFilePath(`realms/${realm}/scripts/scripts-config/`, true);
  const result = await findFilesByName(
    `${fileName}.json`,
    true,
    `${getWorkingDirectory()}/realms/${realm}/scripts/scripts-config`
  );

  if (result.length) {
    printMessage(result.length);
    return true;
  } else {
    printMessage(result.length);
    return false;
  }
}
