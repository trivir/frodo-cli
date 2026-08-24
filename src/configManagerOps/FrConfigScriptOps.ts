import { frodo, state } from '@rockcarver/frodo-lib';
import { ScriptSkeleton } from '@rockcarver/frodo-lib/types/api/ScriptApi';
import fs from 'fs';

import { printError, verboseMessage } from '../utils/Console';
import { realmList, safeFileName } from '../utils/FrConfig';

const { getFilePath, saveJsonToFile, decodeBase64, saveTextToFile } =
  frodo.utils;
const { readScripts, readScriptByName, importScripts } = frodo.script;

type ByName = { scriptName: string };
type BySkeleton = { ss: ScriptSkeleton };

// Export script using its name
export async function configManagerExportScript(
  criteria: ByName,
  justContent: boolean,
  justConfig: boolean
): Promise<boolean>;
// Export script using the provided ScriptSkeleton
export async function configManagerExportScript(
  criteria: BySkeleton,
  justContent: boolean,
  justConfig: boolean
): Promise<boolean>;
/**
 * Export script in fr-config-manager format
 * @param criteria Either ScriptSkeleton or string
 * @returns True if export was successful
 */
export async function configManagerExportScript(
  criteria: ByName | BySkeleton,
  justContent: boolean = false, // create only the content folder for the specified script, outranks justConfig
  justConfig: boolean = false // create only the config folder, ignored if justContent is set
): Promise<boolean> {
  const realm = state.getRealm();
  const realmDir = realm === '/' ? 'root' : realm;
  try {
    const s: ScriptSkeleton =
      'ss' in criteria
        ? criteria.ss
        : await readScriptByName(criteria.scriptName);
    verboseMessage(`    Exporting ${s.name} script`);

    // script is in base64 in ScriptSkeleton so decode
    const decodedScript: string = decodeBase64(
      Array.isArray(s.script) ? s.script.join('\n') : s.script
    );
    const fileExtension: string =
      s.language === 'JAVASCRIPT' ? '.js' : '.groovy';
    const scriptName = safeFileName(s.name);
    const relScriptPath: string = `scripts-content/${s.context}/${scriptName}${fileExtension}`;

    if (!justContent) {
      // create config file for the script
      const fileObj = {
        file: justConfig ? `${s.name}${fileExtension}` : relScriptPath,
      };
      delete s.script;
      saveJsonToFile(
        { ...s, script: fileObj },
        getFilePath(
          `realms/${realmDir}/scripts/scripts-config/${s._id}.json`,
          true
        ),
        false,
        false,
        true
      );
    }

    if (justConfig && !justContent) {
      // dont create script file
      return true;
    }

    // create script file
    saveTextToFile(
      decodedScript,
      getFilePath(`realms/${realmDir}/scripts/${relScriptPath}`, true)
    );

    return true;
  } catch (error) {
    printError(
      error,
      'scriptName' in criteria
        ? `Script "${criteria.scriptName}" was not found is in the realm "${realmDir}"`
        : ''
    );
    return false;
  }
}

/**
 * Export all scripts from the current realm set in state
 * @param prefix If set, will look only for scripts that start with prefix
 * @param justContent If set, will only export the actual script file, not config
 * @param justConfig If set, will only export a scripts config file
 * @param scriptType If set, will only export the one script and its config file unless just-content is specified
 * @param language If set, will only export scripts that are in a certain programming language, by default, only js files
 * @returns True if export was successful
 */
export async function configManagerExportScriptsRealms(
  prefix: string = null,
  justContent: boolean = false,
  justConfig: boolean = false,
  scriptType: string = null,
  language: string = 'JAVASCRIPT'
): Promise<boolean> {
  try {
    // create scripts directory if it doesnt exist even if there are no scripts, thats what fr-config-manager does
    const realm = state.getRealm();
    const realmDir = realm === '/' ? 'root' : realm;
    getFilePath(`realms/${realmDir}/scripts/`, true);
    let allScripts: ScriptSkeleton[] = await readScripts();

    // get scripts that start with prefix
    if (prefix) {
      allScripts = allScripts.filter((ss) => ss.name.startsWith(prefix));
      if (allScripts.length === 0) {
        verboseMessage(
          `There are no scripts that start with "${prefix}" in the ${realmDir} realm.`
        );
        return true;
      }
    }

    // get scripts that are of a certain type
    if (scriptType) {
      allScripts = allScripts.filter((ss) => ss.context === scriptType);
      if (allScripts.length === 0) {
        verboseMessage(
          `There are no scripts of type "${scriptType}" in the ${realmDir} realm.`
        );
        return true;
      }
    }

    // get scripts written in specfic programming language
    language = language ? language.toUpperCase() : null;
    if (language !== 'JAVASCRIPT') {
      // if all is set as the language, don't modify scripts list
      if (language !== 'ALL') {
        if (language !== 'GROOVY') {
          verboseMessage(`"${language}" is not a valid programming language`);
          return true;
        }
        allScripts = allScripts.filter((ss) => ss.language === 'GROOVY');
        if (allScripts.length === 0) {
          verboseMessage(
            `There are no scripts written in groovy in the ${realmDir} realm.`
          );
          return true;
        }
      }
    } else {
      allScripts = allScripts.filter((ss) => ss.language === 'JAVASCRIPT');
      if (allScripts.length === 0) {
        verboseMessage(
          `There are no scripts written in javascript in the ${realmDir} realm.`
        );
        return true;
      }
    }

    // if there are no scripts, return
    if (allScripts.length !== 0) {
      for (const s of allScripts) {
        if (
          !(await configManagerExportScript({ ss: s }, justContent, justConfig))
        ) {
          return false;
        }
      }
    } else {
      verboseMessage(`There are no scripts in the realm "${realmDir}"`);
    }
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

/**
 * Export all scripts from all realms
 * @returns True if export was successful
 */
export async function configManagerExportScriptsAll(
  prefix: string = null,
  justContent: boolean = false,
  justConfig: boolean = false,
  scriptType: string = null,
  language: string = 'JAVASCRIPT'
): Promise<boolean> {
  try {
    for (const realm of await realmList()) {
      if (
        realm === '/' &&
        state.getDeploymentType() ===
          frodo.utils.constants.CLOUD_DEPLOYMENT_TYPE_KEY
      )
        continue;

      state.setRealm(realm);
      verboseMessage(`\n${state.getRealm()} realm:`);
      if (
        !(await configManagerExportScriptsRealms(
          prefix,
          justContent,
          justConfig,
          scriptType,
          language
        ))
      ) {
        return false;
      }
    }
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

/**
 * Import script in fr-config-manager format
 * @param {string} realm option to determine which realm to import
 * @param {string} name option to import a specific script by name
 * @returns True if Import was successful
 */
export async function configManagerImportScripts(
  realm?: string,
  name?: string
): Promise<boolean> {
  try {
    const realmsDir = getFilePath('realms/');
    const realms: string[] = realm
      ? [realm]
      : fs
          .readdirSync(realmsDir, { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name);

    for (const realm of realms) {
      state.setRealm(realm);

      const configDir = getFilePath(`realms/${realm}/scripts/scripts-config/`);

      const configFiles = name ? [name] : fs.readdirSync(configDir);

      const scripts = { script: {} };

      for (const file of configFiles) {
        try {
          const configPath = `${configDir}/${file}`;
          if (!fs.existsSync(configPath)) continue;
          const importData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (name && importData.script.name !== name) continue;
          const fullScriptPath = getFilePath(
            `realms/${realm}/scripts/${importData.script.file}`
          );
          delete importData.script.file;
          importData.script = fs.readFileSync(fullScriptPath, 'utf8');
          scripts.script[importData._id] = importData;
        } catch (error) {
          printError(error);
        }
      }

      await importScripts(null, null, scripts);
    }

    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}
