import { frodo } from '@rockcarver/frodo-lib';
import { MappingSkeleton } from '@rockcarver/frodo-lib/types/ops/MappingOps';

import { printError, verboseMessage } from '../utils/Console';

const { readMappings } = frodo.idm.mapping;
const { getFilePath, saveJsonToFile } = frodo.utils;

/**
 * Export the given mapping
 * @param m The skeleton that contains all the mapping information
 * @returns True if succesful
 */
<<<<<<< HEAD
export async function configManagerExportConnectorMapping(
=======
export async function exportConnectorMapping(
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
  m: MappingSkeleton
): Promise<boolean> {
  try {
    // "fr-config-pull connector-mapping" only exports sync mappings
    if (m._id.startsWith('sync')) {
      verboseMessage(`  Exporting connector mapping: "${m._id}"`);
      delete m._id;
      delete m.syncAfter;
      saveJsonToFile(
        m,
        getFilePath(`sync/mappings/${m.name}/${m.name}.json`, true),
        false,
        false
      );
    } else {
      verboseMessage(`  Ignoring ${m._id}`);
    }

    return true;
  } catch (err) {
    printError(err);
    return false;
  }
}

/**
 * Export all mappings to separate files in fr-config-manager format
 * @param {MappingExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
<<<<<<< HEAD
export async function configManagerExportMappingsAll(): Promise<boolean> {
  try {
    const mappings: MappingSkeleton[] = await readMappings();
    for (const map of mappings) {
      configManagerExportConnectorMapping(map);
=======
export async function exportAllMappings(): Promise<boolean> {
  try {
    const mappings: MappingSkeleton[] = await readMappings();
    for (const map of mappings) {
      exportConnectorMapping(map);
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
    }
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}
