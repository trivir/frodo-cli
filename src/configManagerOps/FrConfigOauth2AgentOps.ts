import { frodo, state } from '@rockcarver/frodo-lib';
import { AgentSkeleton } from '@rockcarver/frodo-lib/types/api/AgentApi';

import { printError, verboseMessage } from '../utils/Console';

const { getFilePath, saveJsonToFile } = frodo.utils;
const { readRealms } = frodo.realm;
const { readAgents, readAgent } = frodo.agent;

/**
 * Export agent using its name/id in fr-config manager format
 * @param agentName Name/id of agent to be exported
 * @returns True if export was successful
 */
export async function exportAgent(agentName: string): Promise<boolean> {
  try {
    // global option isn't availble for deployment type cloud so set to false
    const a: AgentSkeleton = await readAgent(agentName, false);

    verboseMessage(`    Exporting ${a._id} agent`);

    saveJsonToFile(
      a,
      getFilePath(
        `realms/${state.getRealm()}/realm-config/agents/${a._type._id}/${a._id}.json`,
        true
      ),
      false,
      false
    );

    return true;
  } catch (error) {
    printError(
      error,
      `Agent "${agentName}" was not found in the realm "${state.getRealm()}"`
    );
    return false;
  }
}

/**
 * Export all agents in the current realm in fr-config manaer format
 * @returns True if export waws successful
 */
export async function exportRealmAgents(): Promise<boolean> {
  try {
    // global option isn't availble for deployment type cloud so set to false.
    // Can't use any of the agent skeletons to make json.
    // for some reason, all the agent skeletons in the allAgents list are missing data.
    // have to pass only the agent id then call readAgent(id/agentName) which returns a skeleton with all the needed data
    const allAgents: AgentSkeleton[] = await readAgents(false);

    // if there are no agents, return
    if (allAgents.length !== 0) {
      for (const a of allAgents) {
        if (!(await exportAgent(a._id))) {
          return false;
        }
      }
    } else {
      verboseMessage(
        `  There are no agents in the realm "${state.getRealm()}"`
      );
    }
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

/**
 * Export all Agents from all realms
 * @returns True if export was successful
 */
export async function exportAllAgents(): Promise<boolean> {
  try {
    for (const realm of await readRealms()) {
      state.setRealm(realm.name);
      verboseMessage(`\n${state.getRealm()} realm:`);
      if (!(await exportRealmAgents())) {
        return false;
      }
    }
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}
