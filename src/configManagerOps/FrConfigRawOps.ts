import { frodo, state } from '@rockcarver/frodo-lib';
import { readFile } from 'fs/promises';

import { printError, verboseMessage } from '../utils/Console';
import { IdObjectSkeletonInterface } from '@rockcarver/frodo-lib/types/api/ApiTypes';

const { getFilePath, saveJsonToFile, json } = frodo.utils;
const { exportRawIdm, exportRawAm, exportRawEnv } = frodo.raw;

/**
 * Export every item from the list in the provided json file
 * @returns True if each file was successfully exported
 */
export async function exportRawFiles(file: string = null): Promise<boolean> {
    try {
        const jsonData = JSON.parse(await readFile(file, { encoding: 'utf8' }));

        // Create export json file for every item in the provided json file
        for (const config of jsonData) {
            let response: IdObjectSkeletonInterface;

            // remove starting slash from path if it exists
            if (config.path.startsWith('/')) {
                config.path = config.path.substring(1);
            }

            // support for only three root paths, am, openidm, and environment
            const urlParts: string[] = config.path.split('/');
            const startPath: string = (urlParts.reverse().pop());
            const noStart: string = urlParts.reverse().join('/');
            switch (startPath) {
                case 'openidm':
                    response = await exportRawIdm(noStart);
                    break;
                case 'am':
                    response = await exportRawAm(noStart);
                    // fr-config-manager has this option, only for am end points
                    if (config.pushApiVersion) {
                        response._pushApiVersion = config.pushApiVersion;
                    }
                    break;
                case 'environment':
                    response = await exportRawEnv(noStart);
                    break;
                default:
                    printError(new Error(`URL paths that start with ${startPath} are not supported`));
                    break;
            }

            // all endpoints can have overrides
            if (config.overrides) {
                response = json.mergeDeep(response, config.overrides);
            }

            verboseMessage(`Saving ${response._id} at ${config.path}.json.`);
            saveJsonToFile(response, getFilePath(`raw/${config.path}.json`, true), false, false);
        }

        return true;
    } catch (error) {
        printError(error);
        return false;
    }
}
