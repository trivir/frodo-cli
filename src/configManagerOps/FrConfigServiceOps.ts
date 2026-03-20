import { frodo, state } from '@rockcarver/frodo-lib';
import fs from 'fs';

import { printError } from '../utils/Console';
import { realmList } from '../utils/FrConfig';

const { getFilePath, saveJsonToFile } = frodo.utils;
const { getFullServices, importService } = frodo.service;

/**
 * Export all services to separate files in fr-config-manager format
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function configManagerExportServices(
  realm?,
  name?
): Promise<boolean> {
  try {
    if (realm && realm !== '__default__realm__') {
      const services = await getFullServices(false);
      processServices(services, realm, name);
    } else {
      for (const realm of await realmList()) {
        state.setRealm(realm);
        const services = await getFullServices(false);
        processServices(services, realm, name);
      }
    }
    return true;
  } catch (error) {
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

async function processImportServices(realm: string, dir?: string) {
  
  if (realm !== 'alpha' && realm !== 'bravo') {
    return [];
  }
  const getDir = dir ?? getFilePath(`realms/${realm}/services/`);
  const entries = fs.readdirSync(getDir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {

    const fullPath = `${getDir}/${entry.name}`;

    if (entry.isDirectory()) {
      const subResults = await processImportServices(realm, fullPath);
      results.push(...subResults);
    } else if (entry.name.endsWith('.json')) {
      results.push(fullPath);
    }
  }
  return results;
}

export async function configManagerImportServices(realm?): Promise<boolean> {
  try {
    const filePaths = await processImportServices(realm);

    for (const filePath of filePaths) {
      const serviceData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const serviceId = serviceData._type._id;
    
      await importService(
        serviceId,
        { service: { [serviceId]: { ...serviceData, location: realm } } },
        { clean: false, global: false, realm: true }
      );
    }
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}