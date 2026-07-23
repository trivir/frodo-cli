import { frodo, state } from '@rockcarver/frodo-lib';

import { printError, verboseMessage } from '../utils/Console';
import { realmList, safeFileName } from '../utils/FrConfig';

const { getFilePath, saveJsonToFile, decodeBase64, saveTextToFile } =
  frodo.utils;
const { readScripts, readScriptByName } = frodo.script;

/**
 * Export scripts
 * @param {string} prefix If set, will look only for scripts that start with prefix
 * @param {string} realm Designates the specific realm to pull from
 * @param {string} name only exports specifically named script
 * @returns True if export was successful
 */
export async function configManagerExportScripts(
  prefix?: string[],
  realm?: string,
  name?: string
): Promise<boolean> {
  try {
    const prefixes = prefix ?? [];
    const realms =
      realm && realm !== frodo.utils.constants.DEFAULT_REALM_KEY
        ? [realm]
        : await realmList();
    for (const realm of realms) {
      if (
        realm === '/' &&
        state.getDeploymentType() ===
          frodo.utils.constants.CLOUD_DEPLOYMENT_TYPE_KEY
      )
        continue;

      state.setRealm(realm);
      verboseMessage(`\n${state.getRealm()} realm:`);
      const scripts = name
        ? [await readScriptByName(name)]
        : await readScripts();
      for (const s of scripts) {
        if (
          (name && name !== s.name) ||
          (prefixes.length && !prefixes.some((p) => s.name.startsWith(p)))
        )
          continue;
        if (s.language !== 'JAVASCRIPT') continue;

        const decodedScript = decodeBase64(
          Array.isArray(s.script) ? s.script.join('\n') : s.script
        );
        const scriptName = safeFileName(s.name);
        const relScriptPath = `scripts-content/${s.context}/${scriptName}.js`;
        const fileObj = { file: relScriptPath };

        saveJsonToFile(
          { ...s, script: fileObj },
          getFilePath(
            `realms/${state.getRealm()}/scripts/scripts-config/${s._id}.json`,
            true
          ),
          false,
          false,
          true
        );
        saveTextToFile(
          decodedScript,
          getFilePath(
            `realms/${state.getRealm()}/scripts/${relScriptPath}`,
            true
          )
        );
      }
    }
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}
