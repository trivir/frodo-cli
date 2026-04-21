import { frodo } from '@rockcarver/frodo-lib';
import fs from 'fs';

import { printError } from '../utils/Console';

const { saveJsonToFile, getFilePath, saveTextToFile } = frodo.utils;
const { readCustomNode, readCustomNodes, importCustomNodes } = frodo.authn.node;

/**
 * Export all custom nodes to 'custom-nodes/nodes' directory.
 * Each custom node will be exported as a JSON file with a reference to its script file.
 * The script content will be saved in a separate .js file.
 * @param {string} name Optional display name of a custom node to export. If not provided, all custom nodes will be exported.
 * @returns {Promise<boolean>} True if export was successful
 */
export async function configManagerExportCustomNodes(
  name?: string
): Promise<boolean> {
  try {
    let customNodes;
    if (name) {
      const customNode = await readCustomNode(undefined, name);
      customNodes = [customNode];
    } else {
      customNodes = await readCustomNodes();
    }

    for (const node of customNodes) {
      const nodeDir = getFilePath(
        `custom-nodes/nodes/${node.displayName}/`,
        true
      );
      const scriptFileName = `${node.displayName}.js`;
      const jsonFileName = `${node.displayName}.json`;

      saveTextToFile(`${node.script}`, nodeDir + scriptFileName);
      node.script = { file: scriptFileName };

      const filePath = nodeDir + jsonFileName;
      saveJsonToFile(node, filePath, false);
    }

    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

/**
 * Import all custom nodes to specified tenant.
 * @param {string} name Optional display name of a custom node to import. If not provided, all custom nodes will be exported.
 * @returns {Promise<boolean>} True if export was successful
 */

export async function configManagerImportCustomNode(
  nodeName?: string
): Promise<boolean> {
  try {
    if (nodeName) {
      const nodeDir = getFilePath(`custom-nodes/nodes/${nodeName}`);
      const jsonFilePath = `${nodeDir}/${nodeName}.json`;
      const scriptFilePath = `${nodeDir}/${nodeName}.js`;
      const customNodeData = { nodeTypes: {} };

      const importData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

      if (fs.existsSync(scriptFilePath)) {
        importData.script = fs.readFileSync(scriptFilePath, 'utf8');
      }

      customNodeData.nodeTypes[importData._id] = importData;
      await importCustomNodes(undefined, nodeName, customNodeData);
    } else {
      const nodesDir = getFilePath(`custom-nodes/nodes`);
      const nodeFolders = fs.readdirSync(nodesDir);
      const customNodeData = { nodeTypes: {} };

      for (const nodeFolder of nodeFolders) {
        const jsonFilePath = `${nodesDir}/${nodeFolder}/${nodeFolder}.json`;
        const scriptFilePath = `${nodesDir}/${nodeFolder}/${nodeFolder}.js`;

        const importData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

        if (fs.existsSync(scriptFilePath)) {
          importData.script = fs.readFileSync(scriptFilePath, 'utf8');
        }

        customNodeData.nodeTypes[importData._id] = importData;

        await importCustomNodes(undefined, nodeName, customNodeData);
      }
    }

    return true;
  } catch (error) {
    printError(error, `Error importing custom nodes`);
  }
  return false;
}
