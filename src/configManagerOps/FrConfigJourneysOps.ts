import { frodo, state } from '@rockcarver/frodo-lib';
import {
  MultiTreeExportInterface,
  TreeExportOptions,
} from '@rockcarver/frodo-lib/types/ops/JourneyOps';

import { extractFrConfigDataToFile } from '../utils/Config';
<<<<<<< HEAD
import { printError, printMessage } from '../utils/Console';
=======
import { printError } from '../utils/Console';
import { realmList } from './FrConfigOps';
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd

const {
  saveJsonToFile,
  getWorkingDirectory,
  getFilePath,
  findFilesByName,
  sanitize,
} = frodo.utils;
<<<<<<< HEAD
const { readJourneys, exportJourneys } = frodo.authn.journey;
const { readRealms } = frodo.realm;
=======
const { exportJourneys } = frodo.authn.journey;
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd

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
<<<<<<< HEAD
      const readData = await readJourneys();
      saveJsonToFile(readData, 'readjournyes.json', false, false);
=======
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
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
<<<<<<< HEAD
        saveJsonToFile(
          exportData.trees,
          `exportJourneyFor${realm}.json`,
          false,
          false
        );
=======
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
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

<<<<<<< HEAD
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

=======
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
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
<<<<<<< HEAD
    for (const [, journey] of Object.entries(journeys) as [string, any]) {
      if (name && !matchJourneyName(journey, name)) {
=======
    for (const [id, journey] of Object.entries(journeys) as [string, any]) {
      if (name && name !== id) {
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
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
<<<<<<< HEAD
              printMessage(subNodeSpec._id);
=======
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
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
<<<<<<< HEAD
          printMessage('Trying to save the script on the node');
          printMessage(nodeId);
          printMessage(node.script);

=======
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
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
<<<<<<< HEAD
    node.hasOwnProperty('script') &&
    (!node.hasOwnProperty('useScript') || node.useScript)
=======
    Object.prototype.hasOwnProperty.call(node, 'script') &&
    (!Object.prototype.hasOwnProperty.call(node, 'useScript') || node.useScript)
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
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
<<<<<<< HEAD
    printMessage(result.length);
    return true;
  } else {
    printMessage(result.length);
=======
    return true;
  } else {
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
    return false;
  }
}
