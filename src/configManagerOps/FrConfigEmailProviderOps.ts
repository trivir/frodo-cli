import { frodo } from '@rockcarver/frodo-lib';
import { IdObjectSkeletonInterface } from '@rockcarver/frodo-lib/types/api/ApiTypes';

import { printError } from '../utils/Console';

const { config } = frodo.idm;
const { getFilePath, saveJsonToFile } = frodo.utils;

/**
 * Export the email provider configuration json in fr-config manager format
 * @returns True if file was successfully saved
 */
<<<<<<< HEAD
export async function configManagerExportEmailProviderConfiguration(): Promise<boolean> {
=======
export async function exportEmailProviderConfiguration(): Promise<boolean> {
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
  try {
    const emailProvider: IdObjectSkeletonInterface =
      await config.readConfigEntity('external.email');

    saveJsonToFile(
      emailProvider,
      getFilePath('email-provider/external.email.json', true),
      false,
      false
    );
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}
