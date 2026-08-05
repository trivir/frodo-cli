import { frodo, state } from '@rockcarver/frodo-lib';
import fs from 'fs';

import { printError, verboseMessage } from '../utils/Console';
import { AgentType } from '@rockcarver/frodo-lib/types/api/AgentApi';
import { escapePlaceholders } from '../utils/FrConfig';

const { getFilePath, saveJsonToFile } = frodo.utils;
const { readAgentByTypeAndId } = frodo.agent;

/**
 * Export all agents based on values in provided config file.
 * @param configFile The path to the file
 * @returns True if all specified agents were exported successfully
 */
export async function configManagerExportConfigAgents(
  configFile: string
): Promise<boolean> {
  try {
    verboseMessage(`Reading the config file "${configFile}"`);
    const configFileData = JSON.parse(fs.readFileSync(configFile, { encoding: 'utf8' }));
    for (const realm of Object.keys(configFileData)) {
      state.setRealm(realm);
      for (const agentType of Object.keys(configFileData[realm])){
        for (const agent of configFileData[realm][agentType]) {
          const targetDir = `realms/${state.getRealm()}/realm-config/agents/${agentType}`;
          const agentResponse = await readAgentByTypeAndId(agentType as AgentType, agent.id);
          let config = escapePlaceholders(agentResponse);
          const mergedConfig = { ...config, ...agent.overrides};
          saveJsonToFile(mergedConfig, getFilePath(`${targetDir}/${agent.id}.json`, true));
        }
      }
    }
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}