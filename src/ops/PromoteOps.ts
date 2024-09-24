import { frodo, FrodoError, state } from '@rockcarver/frodo-lib';
import {
  FullExportInterface,
  FullExportOptions,
} from '@rockcarver/frodo-lib/types/ops/ConfigOps';
import * as crypto from 'crypto';
import deepDiff from 'deep-diff';
import * as fs from 'fs';
import { promises } from 'fs';
import * as path from 'path';

import { getFullExportConfigFromDirectory } from '../utils/Config';
import { printError, verboseMessage } from '../utils/Console';
import { deleteAgent, deleteIdentityGatewayAgent, deleteJavaAgent, deleteWebAgent, importAgentFromFile, importIdentityGatewayAgentFromFile, importJavaAgentFromFile, importWebAgentFromFile } from './AgentOps';
import {
  deleteApplication,
  importApplicationsFromFile,
} from './ApplicationOps';
import { importAuthenticationSettingsFromFile } from './AuthenticationSettingsOps';
import { deleteSecret, importSecretFromFile } from './cloud/SecretsOps';
import {
  deleteVariableById,
  importVariableFromFile,
} from './cloud/VariablesOps';
import { exportItem } from './ConfigOps';
import { importEmailTemplateFromFile } from './EmailTemplateOps';
import { importConfigEntityFromFile } from './IdmOps';
import { importSocialIdentityProviderFromFile } from './IdpOps';
import { deleteJourney, importJourneyFromFile } from './JourneyOps';
import { deleteMapping, importMappingFromFile } from './MappingOps';
import { importOAuth2ClientFromFile } from './OAuth2ClientOps';
import { deletePolicyById, importPolicyFromFile } from './PolicyOps';
import { deletePolicySetById, importPolicySetsFromFile } from './PolicySetOps';
import {
  deleteResourceTypeUsingName,
  importResourceTypesFromFile,
} from './ResourceTypeOps';
import { deleteSaml2ProviderById, importSaml2ProviderFromFile } from './Saml2Ops';
import { deleteScriptId, importScriptsFromFile } from './ScriptOps';
import { deleteService, importFirstServiceFromFile } from './ServiceOps.js';
import { deleteTheme, importThemesFromFile } from './ThemeOps';
import { Agent } from 'https';
import { importIdentityGatewayAgent, importJavaAgent, importWebAgent } from '@rockcarver/frodo-lib/types/ops/AgentOps';
import { importCirclesOfTrustFromFile } from './CirclesOfTrustOps';

const {
  saveJsonToFile,
  saveTextToFile,
  getFilePath,
  getWorkingDirectory,
  getRealmUsingExportFormat,
} = frodo.utils;
const { exportFullConfiguration } = frodo.config;

const exportDir = getWorkingDirectory(true) + '/frodo-export';

const changed = [];
const deleted = [];
const added = [];
const logmessages = [];

export async function compareExportToDirectory(
  masterDir: string,
  exportDir: string,
  options: FullExportOptions = {
    useStringArrays: true,
    noDecode: false,
    coords: true,
    includeDefault: true,
    includeActiveValues: false,
    target: '',
  },
): Promise<boolean> {
  try {
    var options = options;
    verboseMessage(`Master dir: ${masterDir}`);
    verboseMessage(`Export dir: ${exportDir}`);
    // var direct = dir
    //export the full configuration

    // verboseMessage("exporting")
    // emptyDirectory(exportDir)
    // if(!await exportEverythingToFiles(options)){
    //   throw new FrodoError("Errors occured while exporting files")
    // }

    // let fileName = 'all.config.json';
    // verboseMessage("importing export")
    // const exportData = await getFullExportConfigFromDirectory(exportDir);
    // saveJsonToFile(exportData, getFilePath(fileName, true));

    // //import everything from separate files in a directory
    // // Todo: state.getDirectory changed over to a parameter passed in
    // verboseMessage("importing local dir")
    // const data = await getFullExportConfigFromDirectory(dir);
    // let filename2 = 'all2.config.json';
    // saveJsonToFile(data, getFilePath(filename2, true))
    // verboseMessage("Json diffing")
    // const diff = deepDiff.diff(data, exportData)
    // let jsonDiffname = 'jsonDiff.config.json';
    // if (diff) {
    //   verboseMessage("savingDiff")
    //   saveTextToFile(JSON.stringify(diff), getFilePath(jsonDiffname, true))
    // }

    verboseMessage('fileDiffing');
    const fileDiffname = 'fileDiff.config.json';
    await compareDirectoriesAndChange(exportDir, masterDir);
    const compareObj: CompareObj = { added, changed, deleted };
    saveJsonToFile(compareObj, getFilePath('a1' + fileDiffname, true));
    saveJsonToFile(logmessages, getFilePath('a2' + fileDiffname, true));

    // while (added.length > 0) {
    //   added.pop()
    // }
    // while (changed.length > 0) {
    //   changed.pop()
    // }
    // while (deleted.length > 0) {
    //   deleted.pop()
    // }
    // emptyDirectory(exportDir)
    // if(!await exportEverythingToFiles(options)){
    //   throw new FrodoError("Errors occured while exporting files")
    // }

    // verboseMessage("fileDiffing")
    // await compareDirectories(exportDir, dir1)
    // let compareObj2: CompareObj = {added, changed, deleted}
    // saveJsonToFile(compareObj, getFilePath("b1" + fileDiffname, true))

    return true;
  } catch (error) {
    printError(error);
    verboseMessage('Hello there we have an error!!!!!!!!!!!');
  }
  return false;
}

/**
 * Export everything to separate files
 * @param {boolean} extract Extracts the scripts from the exports into separate files if true
 * @param {boolean} separateMappings separate sync.json mappings if true, otherwise keep them in a single file
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {FullExportOptions} options export options
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function exportEverythingToFiles(
  options: FullExportOptions = {
    useStringArrays: true,
    noDecode: false,
    coords: true,
    includeDefault: false,
    includeActiveValues: false,
    target: '',
  },
  extract: boolean = true,
  separateMappings: boolean = false,
  includeMeta: boolean = false
): Promise<boolean> {
  try {
    const collectErrors: Error[] = [];
    const exportData: FullExportInterface = await exportFullConfiguration(
      options,
      collectErrors
    );
    delete exportData.meta;
    const baseDirectory = exportDir;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.entries(exportData.global).forEach(([type, obj]: [string, any]) =>
      exportItem(
        exportData.global,
        type,
        obj,
        `${baseDirectory}/global`,
        includeMeta,
        extract,
        separateMappings
      )
    );
    Object.entries(exportData.realm).forEach(([realm, data]: [string, any]) =>
      Object.entries(data).forEach(([type, obj]: [string, any]) =>
        exportItem(
          data,
          type,
          obj,
          `${baseDirectory}/realm/${realm}`,
          includeMeta,
          extract,
          separateMappings
        )
      )
    );
    if (collectErrors.length > 0) {
      throw new FrodoError(`Errors occurred during full export`, collectErrors);
    }
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}

// Function to hash a file using SHA-256
function hashFile(filePath) {
  const hash = crypto.createHash('sha256');
  const fileData = fs.readFileSync(filePath);
  hash.update(fileData);
  return hash.digest('hex');
}

// Function to compare two directories
async function compareDirectoriesAndChange(dir1, dir2): Promise<void> {
  // Walk through dir1
  const walkDir = (dir, callback) => {
    fs.readdirSync(dir).forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walkDir(filePath, callback);
      } else {
        callback(filePath);
      }
    });
  };

  // First directory traversal
  walkDir(dir1, (file: string) => {
    const relativePath = path.relative(dir1, file);
    const counterpart = path.join(dir2, relativePath);

    if (
      relativePath.startsWith('.git' + path.sep) ||
      relativePath.includes('README.md')
    ) {
      return; // Skip .git directories
    }

    if (fs.existsSync(counterpart)) {
      const hash1 = hashFile(file);
      const hash2 = hashFile(counterpart);
      if (hash1 !== hash2) {
        if (!relativePath.includes("theme")) {
          changeFile(relativePath, dir2, `${dir1}/${relativePath}`);
        }
      }
    } else {
      deleted.push(`'${relativePath}'`);
      deleteFile(relativePath, dir1);
    }
  });

  // Second directory traversal to find added files
  walkDir(dir2, (file: string) => {
    const relativePath = path.relative(dir2, file);
    const counterpart = path.join(dir1, relativePath);

    if (
      relativePath.startsWith('.git' + path.sep) ||
      relativePath.includes('README.md')
    ) {
      return; // Skip .git directories
    }

    if (!fs.existsSync(counterpart)) {
      added.push(`'${relativePath}'`);
      addFile(relativePath, dir2);
    }
  });
}

async function changeFile(path: string, dir: string, counterpartPath: string) {
  let type = getTypeFromPath(path);
  const importFilePath = dir + '/' + path;
  switch (type){
    case 'policy': {
      let policy = getJsonObjectTwoDown(importFilePath)
      let policyCopy = getJsonObjectTwoDown(counterpartPath)
      policyCopy.creationDate = policy.creationDate
      policyCopy.lastModifiedDate = policy.lastModifiedDate
      if(JSON.stringify(policyCopy) === JSON.stringify(policy)) {
        return;
      }
      break;
    }
    case 'resourcetype': {
      let resourceType = getJsonObjectTwoDown(importFilePath)
      let resourceTypeCopy = getJsonObjectTwoDown(counterpartPath)
      resourceTypeCopy.creationDate = resourceType.creationDate
      resourceTypeCopy.lastModifiedDate = resourceType.lastModifiedDate
      if(JSON.stringify(resourceTypeCopy) === JSON.stringify(resourceType)) {
        return;
      }
    }
    default: break
  }
  changed.push(`'${path}'`);
  logmessages.push('file changed:');
  verboseMessage('File Changed: ');
  await addFile(path, dir);
}

async function addFile(path: string, dir: string) {
  let type = getTypeFromPath(path);
  const importFilePath = dir + '/' + path;
  const global = path.substring(0, path.indexOf('/')) === 'global';
  const inRealm = path.substring(0, path.indexOf('/')) === 'realm';
  setRealmFromPath(path, inRealm)

  await addSwitch(importFilePath, type)
}

async function addSwitch(importFilePath: string, type: string) {
  switch (type) {
    case 'application': {
      const application = getJsonObjectTwoDown(importFilePath);
      verboseMessage(`application id: ${application._id}`);
      const outcome = await importOAuth2ClientFromFile(
        application._id,
        importFilePath,
        {
          deps: true,
        }
      );
      logmessages.push(`add application ${importFilePath}`);
      verboseMessage(`add application ${importFilePath}\n`);
      logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      break;
    }
    case 'authentication': {
      const outcome = await importAuthenticationSettingsFromFile(importFilePath);
      logmessages.push(`add authentication ${importFilePath}`);
      verboseMessage(`add authentication ${importFilePath}\n`);
      logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      break;
    }
    case 'journey': {
      const journey = getJsonObjectOneDown(importFilePath);
      const journeyId = Object.keys(journey)[0];
      verboseMessage(`journey Id: ${journeyId}`);
      const outcome = await importJourneyFromFile(journeyId, importFilePath, {
        reUuid: false,
        deps: true,
      });
      logmessages.push(`add journey ${importFilePath}`);
      verboseMessage(`add journey ${importFilePath}\n`);
      logmessages.push(`outcome: ${outcome}`);
      logmessages.push(' ');
      break;
    }
    case 'managedApplication': {
      const outcome = await importApplicationsFromFile(importFilePath, {
        deps: true,
      });
      logmessages.push(`add managedApplication ${importFilePath}`);
      verboseMessage(`add managedApplication ${importFilePath}\n`);
      logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      break;
    }
    case 'policyset': {
      // const outcome = await importPolicySetsFromFile(importFilePath, {
      //   deps: true,
      //   prereqs: true,
      // });
      logmessages.push(`add policyset ${importFilePath}`);
      verboseMessage(`add policyset ${importFilePath}\n`);
      // logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      break;
    }
    case 'resourcetype': {
      const outcome = await importResourceTypesFromFile(importFilePath);
      logmessages.push(`add resourcetype ${importFilePath}`);
      verboseMessage(`add resourcetype ${importFilePath}\n`);
      logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      break;
    }
    case 'script': {
      if (
        importFilePath.endsWith('.js') ||
        importFilePath.endsWith('.groovy')
      ) {
        verboseMessage(importFilePath);
        verboseMessage(
          'this is a script file, we will not import it as a script file,' +
            'but will import the config and that should import the script as well\n'
        );
        logmessages.push(importFilePath);
        logmessages.push(
          'this is a script file, we will not import it as a script file,' +
            'but will import the config and that should import the script as well\n'
        );
        logmessages.push(' ');
        break;
      }
      const script = getJsonObjectTwoDown(importFilePath);
      verboseMessage(`script name: ${script.name}`);
      verboseMessage(`script id: ${script._id}`);
      const outcome = await importScriptsFromFile(
        script._id,
        script.name,
        importFilePath,
        {
          deps: true,
          reUuid: false,
          includeDefault: false,
        }
      );
      logmessages.push(`add script ${importFilePath}`);
      verboseMessage(`add script ${importFilePath}\n`);
      logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      break;
    }
    case 'service': {
      // const outcome = await importFirstServiceFromFile(importFilePath, {
      //   clean: true,
      //   global: global,
      //   realm: inRealm,
      // });
      logmessages.push(`add service ${importFilePath}`);
      verboseMessage(`add service ${importFilePath}\n`);
      // logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      break;
    }
    case 'theme': {
      const theme = getJsonObjectTwoDown(importFilePath)
      logmessages.push(`Theme Id: ${theme._id}`)
      const outcome = await importThemesFromFile(importFilePath)
      logmessages.push(`add theme ${importFilePath}`);
      verboseMessage(`add theme ${importFilePath}\n`);
      logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      break;
    }
    case 'emailTemplate': {
      const emailTemplate = getJsonObjectTwoDown(importFilePath);
      verboseMessage(`Email Template Id: ${emailTemplate._id}`);
      const outcome = await importEmailTemplateFromFile(
        emailTemplate._id,
        importFilePath,
        false
      );
      logmessages.push(`add emailTemplate ${importFilePath}`);
      verboseMessage(`add emailTemplate ${importFilePath}\n`);
      logmessages.push(`outcome: ${outcome}`);
      logmessages.push(' ');
      break;
    }
    case 'idm': {
      if (importFilePath.includes("emailTemplate")) { // if email template the email template add takes care of it so we will not need to do that
        break;
      } 
      const outcome = await importConfigEntityFromFile(importFilePath);
      logmessages.push(`add idm ${importFilePath}`);
      verboseMessage(`add idm ${importFilePath}\n`);
      logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      break;
    }
    case 'secret': {
      const secret = getJsonObjectTwoDown(importFilePath);

      verboseMessage(`Importing secret ${secret._id}...`);
      // const outcome = await importSecretFromFile(
      //   nestedSecret._id,
      //   importFilePath,
      //   false,
      //   null
      // );
      logmessages.push(`add secret ${importFilePath}`);
      verboseMessage(`add secret ${importFilePath}\n`);
      // logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      break;
    }
    case 'sync': {
      const data = fs.readFileSync(importFilePath, 'utf8');
      const importData = JSON.parse(data);
      verboseMessage(`sync Id: ${importData._id}`);
      // const outcome = await importMappingFromFile(
      //   importData._id,
      //   importFilePath,
      //   {
      //     true,
      //   }
      // );
      logmessages.push(`add sync ${importFilePath}`);
      verboseMessage(`add sync ${importFilePath}\n`);
      // logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      break;
    }
    case 'variable': {
      const variable = getJsonObjectOneDown(importFilePath);

      verboseMessage(`Importing variable ${variable._id}...`);
      // const outcome = await importVariableFromFile(
      //   variable._id,
      //   importFilePath
      // );
      logmessages.push(`add variable ${importFilePath}`);
      verboseMessage(`add variable ${importFilePath}\n`);
      // logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      break;
    }
    case 'saml': {
      const hosted = getJsonObjectOneDown(importFilePath).hosted
      const saml = hosted[Object.keys(hosted)[0]];
      verboseMessage(`add saml with entityID = ${saml.entityId}`)
      logmessages.push(`add saml with entityID = ${saml.entityId}`);
      const outcome = await importSaml2ProviderFromFile(
        saml.entityId,
        importFilePath,
        { deps: true }
      )
      logmessages.push(`add saml ${importFilePath}`);
      verboseMessage(`add saml ${importFilePath}\n`);
      logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      break;
    }
    case 'mapping': {
      const data = fs.readFileSync(importFilePath, 'utf8');
      const importData = JSON.parse(data);
      verboseMessage(`mapping Id: ${importData._id}`);
      // const outcome = await importMappingFromFile(
      //   importData._id,
      //   importFilePath,
      //   {
      //     true,
      //   }
      // );
      logmessages.push(`add mapping ${importFilePath}`);
      verboseMessage(`add mapping ${importFilePath}\n`);
      // logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      break;
    }
    case 'agent': {
      const agent = getJsonObjectTwoDown(importFilePath);
      const agentType = agent._type._id
      verboseMessage(`Agent id: ${agent._id} and type: ${agentType}`)
      switch (agentType){
        case 'WebAgent': {
          const outcome = await importWebAgentFromFile(
            agent._id,
            importFilePath
          );
          logmessages.push(`add agents ${importFilePath}`);
          verboseMessage(`add agents ${importFilePath}\n`);
          logmessages.push(`outcome: ${outcome}`)
          break;
        }
        case 'IdentityGatewayAgent': {
          const outcome = await importIdentityGatewayAgentFromFile(
            agent._id,
            importFilePath
          );
          logmessages.push(`add agents ${importFilePath}`);
          verboseMessage(`add agents ${importFilePath}\n`);
          logmessages.push(`outcome: ${outcome}`)
          break;
        }
        case 'J2EEAgent': {
          const outcome = await importJavaAgentFromFile(
            agent._id,
            importFilePath
          );
          logmessages.push(`add agents ${importFilePath}`);
          verboseMessage(`add agents ${importFilePath}\n`);
          logmessages.push(`outcome: ${outcome}`)
          break;
        }
        default: {
          const outcome = importAgentFromFile(
            agent._id,
            importFilePath
          )
          logmessages.push(`add agents ${importFilePath}`);
          verboseMessage(`add agents ${importFilePath}\n`);
          logmessages.push(`outcome: ${outcome}`)
          break;
        }
      }
      logmessages.push(' ');
      break;
    }
    case 'idp': {
      //need to get idp id somehow
      // verboseMessage(
      //   `Importing provider "${
      //     options.idpId
      //   }" into realm "${state.getRealm()}"...`
      // );
      // const outcome = await importSocialIdentityProviderFromFile(
      //   options.idpId,
      //   importFilePath,
      //   {
      //     deps: true,
      //   }
      // );
      //TODO: think about adding circle of trust ops
      logmessages.push(`add idp ${importFilePath}`);
      verboseMessage(`add idp ${importFilePath}\n`);
      // logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      break;
    }
    case 'policy': {
      const policy = getJsonObjectTwoDown(importFilePath)
      verboseMessage(`Add Policy with id: ${policy._id}`)
      const outcome = await importPolicyFromFile(
        policy._id,
        importFilePath,
        {
          deps: true,
          prereqs: false
        }
      )
      logmessages.push(`add policy ${importFilePath}`);
      verboseMessage(`add policy ${importFilePath}\n`);
      logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      break;
    }
    case 'cot': {
      verboseMessage(`Add Circle of Trusts from file: ${importFilePath}`)
      const outcome = await importCirclesOfTrustFromFile(importFilePath);
      logmessages.push(`Add Circle of Trusts from file: ${importFilePath}`)
      break;
    }
    default: {
      logmessages.push(`missed add for ${importFilePath} with type ${type}`);
      verboseMessage(`missed add for ${importFilePath} with type ${type}\n`);
      logmessages.push(' ');
      break;
    }
  }
}

async function deleteFile(path: string, dir: string) {
  let type = getTypeFromPath(path)
  const deleteFilePath = dir + '/' + path;
  const global = path.substring(0, path.indexOf('/')) === 'global';
  const inRealm = path.substring(0, path.indexOf('/')) === 'realm';
  setRealmFromPath(path, inRealm)

  await deleteSwitch(deleteFilePath, type)
}

async function deleteSwitch(deleteFilePath: string, type: string) {
  switch (type) {
    case 'application': {
      logmessages.push(`no delete exitsts for application`);
      logmessages.push(`delete application ${deleteFilePath}`);
      logmessages.push(' ');
      verboseMessage(`no delete exitsts for application`);
      verboseMessage(`delete application ${deleteFilePath}\n`);
      break;
    }
    case 'authentication': {
      logmessages.push(`no delete exitsts for authentication`);
      logmessages.push(`delete authentication ${deleteFilePath}`);
      logmessages.push(' ');
      verboseMessage(`no delete exitsts for authentication`);
      verboseMessage(`delete authentication ${deleteFilePath}\n`);
      break;
    }
    case 'journey': {
      const journey = getJsonObjectOneDown(deleteFilePath);
      const journeyId = Object.keys(journey)[0];
      verboseMessage(
        `Deleting journey ${journeyId} in realm "${state.getRealm()}"...`
      );
      const outcome = await deleteJourney(journeyId, {deep: true, verbose: false, progress: false});
      logmessages.push(`delete journey ${deleteFilePath}`);
      logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      verboseMessage(`delete journey ${deleteFilePath}\n`);
      break;
    }
    case 'managedApplication': {
      const managedApplication = getJsonObjectTwoDown(deleteFilePath);
      verboseMessage(
        `Deleting Managed Application with name ${managedApplication.name}`
      );
      const outcome = await deleteApplication(managedApplication.name, true);
      logmessages.push(`delete managedApplication ${deleteFilePath}`);
      logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      verboseMessage(`delete managedApplication ${deleteFilePath}\n`);
      break;
    }
    case 'policyset': {
      const policyset = getJsonObjectOneDown(deleteFilePath);
      verboseMessage(`policy set Id: ${Object.keys(policyset)[0]}`);
      const outcome = await deletePolicySetById(Object.keys(policyset)[0]);
      logmessages.push(`delete policyset ${deleteFilePath}`);
      logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      verboseMessage(`delete policyset ${deleteFilePath}\n`);
      break;
    }
    case 'resourcetype': {
      const resourcetype = getJsonObjectTwoDown(deleteFilePath);
      verboseMessage(
        `Deleting authorization resource type ${resourcetype.name}`
      );
      const outcome = await deleteResourceTypeUsingName(resourcetype.name);
      logmessages.push(`delete resourcetype ${deleteFilePath}`);
      logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      verboseMessage(`delete resourcetype ${deleteFilePath}\n`);
      break;
    }
    case 'script': {
      if (
        deleteFilePath.endsWith('.js') ||
        deleteFilePath.endsWith('.groovy')
      ) {
        verboseMessage(deleteFilePath);
        verboseMessage(
          'this is a script file, we will not delete it as a script file,' +
            'but will delete the config and that should delete the script as well\n'
        );
        logmessages.push(deleteFilePath);
        logmessages.push(
          'this is a script file, we will not delete it as a script file,' +
            'but will delete the config and that should delete the script as well\n'
        );
        logmessages.push(' ');
        break;
      }
      const script = getJsonObjectTwoDown(deleteFilePath);
      verboseMessage(
        `Deleting script ${script._id} in realm "${state.getRealm()}"...`
      );
      const outcome = await deleteScriptId(script._id);
      logmessages.push(`delete script ${deleteFilePath}`);
      logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      verboseMessage(`delete script ${deleteFilePath}\n`);
      break;
    }
    case 'service': {
      // Need to test this to make sure it really deletes how it should
      const service = getJsonObjectOneDown(deleteFilePath);
      const serviceId = Object.keys(service)[0];
      verboseMessage(`service Id: ${serviceId}`);
      // const outcome = await deleteService(serviceId, global);
      logmessages.push(`delete service ${deleteFilePath}`);
      // logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      verboseMessage(`delete service ${deleteFilePath}\n`);
      break;
    }
    case 'theme': {
      const theme = getJsonObjectTwoDown(deleteFilePath);
      verboseMessage(
        `Deleting theme with id "${
          theme._id
        }" from realm "${state.getRealm()}"...`
      );
      const outcome = await deleteTheme(theme._id);
      logmessages.push(`delete theme ${deleteFilePath}`);
      logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      verboseMessage(`delete theme ${deleteFilePath}\n`);
      break;
    }
    case 'emailTemplate': {
      // No delete written for email template yet
      logmessages.push(`No delete written for emailTemplate yet`);
      logmessages.push(`delete emailTemplate ${deleteFilePath}`);
      // logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      verboseMessage(`No delete written for emailTemplate yet`);
      verboseMessage(`delete emailTemplate ${deleteFilePath}\n`);
      break;
    }
    case 'idm': {
      // No delete fo IDM right now
      logmessages.push(`No delete written for idm`);
      logmessages.push(`delete idm ${deleteFilePath}`);
      //logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      verboseMessage(`delete idm ${deleteFilePath}\n`);
      break;
    }
    case 'secret': {
      const secret = getJsonObjectTwoDown(deleteFilePath);
      verboseMessage(`Deleting secret with id ${secret._id}`);
      // const outcome = await deleteSecret(secret._id);
      logmessages.push(`delete secret ${deleteFilePath}`);
      // logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      verboseMessage(`delete secret ${deleteFilePath}\n`);
      break;
    }
    case 'sync': {
      const data = fs.readFileSync(deleteFilePath, 'utf8');
      const sync = JSON.parse(data);
      verboseMessage(`sync Id: ${sync._id}`);
      // const outcome = await deleteMapping(sync._id);
      logmessages.push(`delete sync ${deleteFilePath}`);
      //logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      verboseMessage(`delete sync ${deleteFilePath}\n`);
      break;
    }
    case 'variable': {
      const variable = getJsonObjectTwoDown(deleteFilePath);
      verboseMessage(`Deleting variable with id: ${variable._id}`);
      // const outcome = await deleteVariableById(variable._id);
      logmessages.push(`delete variable ${deleteFilePath}`);
      // logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      verboseMessage(`delete variable ${deleteFilePath}\n`);
      break;
    }
    case 'saml': {
      const hosted = getJsonObjectOneDown(deleteFilePath).hosted
      const saml = hosted[Object.keys(hosted)[0]];
      verboseMessage(`delete saml with entityID = ${saml.entityId}`)
      logmessages.push(`delete saml with entityID = ${saml.entityId}`);
      await deleteSaml2ProviderById(saml.entityId)
      logmessages.push(`delete saml ${deleteFilePath}`);
      logmessages.push(' ');
      verboseMessage(`delete saml ${deleteFilePath}\n`);
      break;
    }
    case 'mapping': {
      const data = fs.readFileSync(deleteFilePath, 'utf8');
      const mapping = JSON.parse(data);
      verboseMessage(`mapping Id: ${mapping._id}`);
      // const outcome = await deleteMapping(mapping._id);
      logmessages.push(`delete mapping ${deleteFilePath}`);
      // logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      verboseMessage(`delete mapping ${deleteFilePath}\n`);
      break;
    }
    case 'agent': {
      const agent = getJsonObjectTwoDown(deleteFilePath)
      const agentType = agent._type._id
      verboseMessage(
        `Deleting agent '${agent._id}' of type ${agentType} in realm "${state.getRealm()}"...`
      );
      switch (agentType){
        case 'WebAgent': {
          const outcome = await deleteWebAgent(agent._id);
          logmessages.push(`delete WebAgent ${deleteFilePath}`);
          logmessages.push(`outcome: ${outcome}`)
          verboseMessage(`delete agents ${deleteFilePath}\n`);
          break;
        }
        case 'IdentityGatewayAgent': {
          const outcome = await deleteIdentityGatewayAgent(agent._id);
          logmessages.push(`delete IdentityGatewayAgent ${deleteFilePath}`);
          logmessages.push(`outcome: ${outcome}`)
          verboseMessage(`delete agents ${deleteFilePath}\n`);
          break;
        }
        case 'J2EEAgent': {
          const outcome = await deleteJavaAgent(agent._id);
          logmessages.push(`delete IdentityGatewayAgent ${deleteFilePath}`);
          logmessages.push(`outcome: ${outcome}`)
          verboseMessage(`delete agents ${deleteFilePath}\n`);
          break;
        }
        default: {
          const outcome = await deleteAgent(agent._id);
          logmessages.push(`delete agents ${deleteFilePath}`);
          logmessages.push(`outcome: ${outcome}`)
          verboseMessage(`delete agents ${deleteFilePath}\n`);
          break;
        }
      }
      logmessages.push(' ');
      break;
    }
    case 'idp': {
      // No current delete for IDP
      logmessages.push(`No delete for idp written`);
      logmessages.push(`delete idp ${deleteFilePath}`);
      // logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      verboseMessage(`delete idp ${deleteFilePath}\n`);
      break;
    }
    case 'policy': {
      const policy = getJsonObjectTwoDown(deleteFilePath);
      verboseMessage(`policy id: ${policy._id}`);
      const outcome = await deletePolicyById(policy._id);
      logmessages.push(`delete policy ${deleteFilePath}`);
      logmessages.push(`outcome: ${outcome}`)
      logmessages.push(' ');
      verboseMessage(`delete policy ${deleteFilePath}\n`);
      break;
    }
    case 'cot': {
      logmessages.push(`no delete exitsts for Circle of Trust`);
      logmessages.push(`delete Circle of Trust ${deleteFilePath}`);
      logmessages.push(' ');
      verboseMessage(`no delete exitsts for Circle of Trust`);
      verboseMessage(`delete Circle of Trust ${deleteFilePath}\n`);
      break;
    }
    default: {
      logmessages.push(
        `No delete ${deleteFilePath} not setup for type ${type}`
      );
      logmessages.push(' ');
      verboseMessage(`No delete ${deleteFilePath} not setup for type ${type}\n`);
      break;
    }
  }
}

interface CompareObj {
  added: string[];
  changed: string[];
  deleted: string[];
}

function getJsonObjectTwoDown(filePath: string): any {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const fileData = JSON.parse(data);
    const jsonObject = fileData[Object.keys(fileData)[0]];
    return jsonObject[Object.keys(jsonObject)[0]];
  } catch {
    console.error('error in json parsing');
  }
}

function getJsonObjectOneDown(filePath: string): any {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const fileData = JSON.parse(data);
    return fileData[Object.keys(fileData)[0]];
  } catch {
    console.error('error in json parsing');
  }
}

function setRealmFromPath(path: string, inRealm: boolean) {
  if (inRealm) {
    let realm = path.substring(
      path.indexOf('/') + 1,
      path.indexOf('/', path.indexOf('/') + 1)
    );
    realm = getRealmUsingExportFormat(realm);
    verboseMessage(`realm = ${realm}`);
    state.setRealm(realm);
  }
}

function getTypeFromPath(path: string): string {
  let type: string;
  if (path.includes('idm')) {
    type = 'idm';
  } else {
    type = path.substring(
      path.substring(0, path.lastIndexOf('/')).lastIndexOf('/') + 1,
      path.lastIndexOf('/')
    );
  }
  return type;
}