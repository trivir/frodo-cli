import { frodo } from '@rockcarver/frodo-lib';

import { printError, printMessage } from '../utils/Console';

const { checkForUpdates, applyUpdates } = frodo.cloud.startup;

export async function configManagerRestart(
  status?: boolean,
  check?: boolean,
  wait?: boolean
): Promise<boolean> {
  try {
    if (check) {
      const updates = await checkForUpdates();
      const updateCount =
        (updates.secrets?.length || 0) + (updates.variables?.length || 0);
      if (updateCount > 0) {
        printMessage(`${updateCount} update(s) need to be applied`);
      } else {
        printMessage('No updates need to be applied');
      }
      return true;
    }

    if (status) {
      const updates = await checkForUpdates();
      const updateCount =
        (updates.secrets?.length || 0) + (updates.variables?.length || 0);
      if (updateCount === 0) {
        printMessage('All ESVs loaded - not restarting');
        return true;
      }
    }
    const outcome = await applyUpdates(wait || false);
    return outcome;
  } catch (error) {
    printError(error, 'Error restarting environment');
    return false;
  }
}
