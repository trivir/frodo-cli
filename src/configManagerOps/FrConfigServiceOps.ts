import { frodo, state } from '@rockcarver/frodo-lib';

import {
  createProgressIndicator,
  printError,
  stopProgressIndicator,
  updateProgressIndicator,
} from '../utils/Console';
import { realmList } from '../utils/FrConfig';

const { getFilePath, saveJsonToFile } = frodo.utils;
const { getFullServices } = frodo.service;

/**
 * Export all services to separate files in fr-config-manager format
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function configManagerExportServices(
  realm?,
  name?
): Promise<boolean> {
  let indicatorId: string | undefined;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Exporting services'
    );
    if (realm && realm !== '__default__realm__') {
      const services = await getFullServices(false);
      processServices(services, realm, name);
    } else {
      for (const realm of await realmList()) {
        state.setRealm(realm);
        updateProgressIndicator(indicatorId, `Exporting services (${realm})`);
        const services = await getFullServices(false);
        processServices(services, realm, name);
      }
    }
    stopProgressIndicator(indicatorId, 'Exported services');
    return true;
  } catch (error) {
    if (indicatorId) {
      stopProgressIndicator(indicatorId, 'Error exporting services', 'fail');
    }
    printError(error);
  }
  return false;
}

async function processServices(services, realm, name) {
  const fileDir = `realms/${realm}/services`;
  for (const service of services) {
    if (name && name !== service._type._id) {
      continue;
    }
    if (service.nextDescendents.length > 0) {
      for (const descendent of service.nextDescendents) {
        saveJsonToFile(
          descendent,
          getFilePath(
            `${fileDir}/${service._type._id}/${descendent._id}.json`,
            true
          ),
          false,
          true
        );
      }
    }
    delete service.nextDescendents;

    saveJsonToFile(
      service,
      getFilePath(`${fileDir}/${service._type._id}.json`, true),
      false,
      true
    );
  }
}
