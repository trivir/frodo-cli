import { frodo } from '@rockcarver/frodo-lib';
import { printError, printMessage } from '../utils/Console';

const { readPromotionStatus, unlockEnvironment, readLockStatus } =
  frodo.cloud.env.promotion;
const POLL_INTERVAL_SECONDS = 60;

/**
 * Check promotion status.
 * @returns True if the status were retrieved successfully, false otherwise.
 */
export async function configManagerCheckPromotionStatus(): Promise<boolean> {
  try {
    const response = await readPromotionStatus();
    printMessage({
      message: JSON.stringify(response, null, 4),
    });
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

/**
 * Unlock tenants and wait until they are unlocked.
 * @param promotionId Promotion ID associated with the lock.
 * @returns True if tenants were successfully unlocked, false otherwise.
 */
export async function configManagerUnlockTenants(
  promotionId: string
): Promise<boolean> {
  try {
    await unlockEnvironment(promotionId);
    printMessage('Waiting for tenants to unlock');
    let lockStatus = await readLockStatus();
    while (lockStatus.result !== 'unlocked') {
      await new Promise((resolve) =>
        setTimeout(resolve, POLL_INTERVAL_SECONDS * 1000)
      );
      lockStatus = await readLockStatus();
    }
    printMessage(
      JSON.stringify(
        {
          status: lockStatus.result,
        },
        null,
        4
      )
    );
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}
