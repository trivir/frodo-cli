import { frodo } from '@rockcarver/frodo-lib';
import { IdObjectSkeletonInterface } from '@rockcarver/frodo-lib/types/api/ApiTypes';
import fs from 'fs';

import { extractFrConfigDataToFile } from '../utils/Config';
import { printError } from '../utils/Console';

const { readConfigEntity, importConfigEntities } = frodo.idm.config;
const { getFilePath, saveTextToFile } = frodo.utils;
const { stringify } = frodo.utils.json;

type ObjectSkeleton = IdObjectSkeletonInterface & {
  name: string;
};

export type ManagedSkeleton = IdObjectSkeletonInterface & {
  objects: ObjectSkeleton[];
};
const SCRIPT_HOOKS = ['onStore', 'onRetrieve', 'onValidate'];

/**
 * Export an IDM configuration object in the fr-config-manager format.
 * @param {string} envFile File that defines environment specific variables for replacement during configuration export/import
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerExportManagedObjects(
  objectName?: string
): Promise<boolean> {
  try {
    const exportData = (await readConfigEntity('managed')) as ManagedSkeleton;
    processManagedObjects(exportData.objects, 'managed-objects', objectName);
    return true;
  } catch (error) {
    printError(error, `Error exporting config entity endpoints`);
  }
  return false;
}

function processManagedObjects(managedObjects, targetDir, name) {
  try {
    managedObjects.forEach((managedObject) => {
      if (name && name !== managedObject.name) {
        return;
      }

      const objectPath = `${targetDir}/${managedObject.name}`;
      (Object.entries(managedObject) as [string, ObjectSkeleton][]).forEach(
        ([key, value]) => {
          if (value.type && value.type === 'text/javascript' && value.source) {
            const scriptFilename = `${managedObject.name}.${key}.js`;
            value.file = scriptFilename;
            extractFrConfigDataToFile(
              value.source,
              scriptFilename,
              `${objectPath}`
            );
            delete value.source;
          }
        }
      );

      if (managedObject.actions) {
        (Object.entries(managedObject.actions) as [string, any]).forEach(
          ([key, value]) => {
            if (
              value.type &&
              value.type === 'text/javascript' &&
              value.source
            ) {
              const scriptFilename = `${managedObject.name}.actions.${key}.js`;
              value.file = scriptFilename;
              extractFrConfigDataToFile(
                value.source,
                scriptFilename,
                `${objectPath}`
              );
              delete value.source;
            }
          }
        );
      }

      Object.entries(managedObject.schema.properties).forEach(
        ([key, value]) => {
          SCRIPT_HOOKS.forEach((hook) => {
            if (
              // eslint-disable-next-line no-prototype-builtins
              value.hasOwnProperty(hook) &&
              value[hook].type === 'text/javascript' &&
              value[hook].source
            ) {
              const scriptFilename = `${managedObject.name}.${key}.${hook}.js`;
              value[hook].file = scriptFilename;
              extractFrConfigDataToFile(
                value[hook].source,
                scriptFilename,
                `${objectPath}`
              );

              delete value[hook].source;
            }
          });
        }
      );

      const fileName = `${objectPath}/${managedObject.name}.json`;

      saveTextToFile(stringify(managedObject), getFilePath(fileName, true));
    });
  } catch (err) {
    printError(err);
  }
}

/**
 * Import an IDM configuration object in the fr-config-manager format.
 * @param {string} envFile File that defines environment specific variables for replacement during configuration export/import
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerImportManagedObjects(
  objectName?: string
): Promise<boolean> {
  try {
    const managedObjectsPath = getFilePath('managed-objects');
    const managedObjectsFiles = fs.readdirSync(managedObjectsPath);
    const importManagedObjectData = {
      idm: { managed: { _id: 'managed', objects: [] } },
    };
    for (const managedObjectsFile of managedObjectsFiles) {
      const filePath = getFilePath(
        `managed-objects/${managedObjectsFile}/${managedObjectsFile}.json`
      );
      const readManagedObject = fs.readFileSync(filePath) as any;
      const importData = JSON.parse(readManagedObject);
      const id = importData._id;

      if (objectName && id !== `managed-objects/${objectName}`) {
        continue;
      }

      importManagedObjectData.idm.managed.objects.push(importData);
    }

    await importConfigEntities(importManagedObjectData);

    return true;
  } catch (error) {
    printError(error, `Error exporting config entity endpoints`);
  }
  return false;
}
