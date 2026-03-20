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
  if (
    realm === '/' &&
    state.getDeploymentType() ===
      frodo.utils.constants.CLOUD_DEPLOYMENT_TYPE_KEY
  ) {
    return [];
  }

  const getDir = dir ?? getFilePath(`realms/${realm}/services/`);

  if (!fs.existsSync(getDir)) {
    return [];
  }

  const entries = fs.readdirSync(getDir, { withFileTypes: true });

  const results = [];
  for (const entry of entries) {
    const fullPath = `${getDir}/${entry.name}`;

    if (entry.name.endsWith('.json')) {
      const serviceData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      const baseName = entry.name.replace('.json', '');
      const subDirPath = `${getDir}${baseName}`;

      let descendants = [];
      if (fs.existsSync(subDirPath) && fs.statSync(subDirPath).isDirectory()) {
        const subEntries = fs.readdirSync(subDirPath, { withFileTypes: true });
        descendants = subEntries
          .filter((e) => e.name.endsWith('.json'))
          .map((e) => ({
            id: e.name.replace('.json', ''),
            data: JSON.parse(
              fs.readFileSync(`${subDirPath}/${e.name}`, 'utf8')
            ),
          }));
      }
      results.push({ filePath: fullPath, serviceData, descendants });
    }
  }

  return results;
}

export async function configManagerImportServices(realm?): Promise<boolean> {
  try {
    let realms: string[] = [];

    if (realm === '__default__realm__' || !realm) {
      const realmsDir = getFilePath('realms/');
      if (fs.existsSync(realmsDir)) {
        realms = fs
          .readdirSync(realmsDir, { withFileTypes: true })
          .filter((e) => e.isDirectory())
          .map((e) => e.name);
      }
    } else {
      realms = [realm];
    }

    for (const realmName of realms) {
      state.setRealm(`/${realmName}`);

      const services = await processImportServices(realmName);

      for (const { serviceData, descendants = [] } of services) {
        const serviceId = serviceData._type._id;

        if (descendants.length > 0) {
          serviceData.nextDescendents = descendants.map(({ data }) => data);
        }

        const importData = { service: { [serviceId]: serviceData } };

        await importService(serviceId, importData, {
          clean: false,
          global: false,
          realm: true,
        });
      }
    }
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}
