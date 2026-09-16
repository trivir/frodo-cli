import { frodo, state } from '@rockcarver/frodo-lib';
import { AgentType } from '@rockcarver/frodo-lib/types/api/AgentApi';
import { IdObjectSkeletonInterface } from '@rockcarver/frodo-lib/types/api/ApiTypes';
import fs from 'fs';
import path from 'path';

import { printError, verboseMessage } from '../utils/Console';
import {
  clearOperationalAttributes,
  escapePlaceholders,
} from '../utils/FrConfig';

const { getFilePath, saveJsonToFile, getWorkingDirectory, readJsonFile } =
  frodo.utils;
const { readAgentByTypeAndId, importAgent } = frodo.agent;

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
    const configFileData = JSON.parse(
      fs.readFileSync(configFile, { encoding: 'utf8' })
    );
    for (const realm of Object.keys(configFileData)) {
      state.setRealm(realm);
      for (const agentType of Object.keys(configFileData[realm])) {
        for (const agent of configFileData[realm][agentType]) {
          const targetDir = `realms/${state.getRealm()}/realm-config/agents/${agentType}`;
          const agentResponse = await readAgentByTypeAndId(
            agentType as AgentType,
            agent.id
          );
          const config = escapePlaceholders(agentResponse);
          const mergedConfig = { ...config, ...agent.overrides };
          saveJsonToFile(
            mergedConfig,
            getFilePath(`${targetDir}/${agent.id}.json`, true),
            false
          );
        }
      }
    }
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

/**
 * Import all agent configurations.
 * @returns {Promise<boolean>} True if all specified agents were exported successfully
 */
export async function configManagerImportAgents(): Promise<boolean> {
  try {
    const realmsDir = `${getWorkingDirectory()}/realms`;
    const realms: string[] = fs
      .readdirSync(realmsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    for (const realmDir of realms) {
      const realm = realmDir === 'root' ? '/' : realmDir;

      state.setRealm(realm);
      const agentDir = getFilePath(`realms/${realmDir}/realm-config/agents`);

      if (!fs.existsSync(agentDir)) continue;

      const agentTypes = fs.readdirSync(agentDir);

      for (const agentType of agentTypes) {
        const agentTypeDir = path.join(agentDir, agentType);

        for (const file of fs
          .readdirSync(agentTypeDir)
          .filter((f) => path.extname(f) === '.json')) {
          const agent = readJsonFile(
            path.join(agentTypeDir, file)
          ) as IdObjectSkeletonInterface;
          const agentId = agent._id;
          clearOperationalAttributes(agent);

          verboseMessage(`Importing ${agent._id} agent`);

          await importAgent(agentId, { agent: { [agentId]: agent } }, false);
        }
      }
    }
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}
