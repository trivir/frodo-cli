import { frodo } from '@rockcarver/frodo-lib';
import { IdObjectSkeletonInterface } from '@rockcarver/frodo-lib/types/api/ApiTypes';
import fs from 'fs';
import path from 'path';

import { getIdmImportExportOptions } from '../ops/IdmOps';
import { errorHandler } from '../ops/utils/OpsUtils';
import { printError } from '../utils/Console';

const { config } = frodo.idm;
const { getFilePath, saveJsonToFile } = frodo.utils;

/**
 * Export the email provider configuration json in fr-config manager format
 * @returns True if file was successfully saved
 */
export async function configManagerExportEmailProviderConfiguration(): Promise<boolean> {
  try {
    const emailProvider: IdObjectSkeletonInterface =
      await config.readConfigEntity('external.email');

    saveJsonToFile(
      emailProvider,
      getFilePath('email-provider/external.email.json', true),
      false,
      true
    );
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

export async function configManagerImportEmailProivder(
  file?: string,
  envFile?: string,
  validate: boolean = false
): Promise<boolean> {
  try {
    const fileData = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
    let importData = JSON.parse(fileData);
    importData = { idm: { [importData._id]: importData } };
    const options = getIdmImportExportOptions(undefined, envFile);

    await config.importConfigEntities(
      importData,
      'external.email',
      {
        envReplaceParams: options.envReplaceParams,
        entitiesToImport: undefined,
        validate,
      },
      errorHandler
    );
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}
