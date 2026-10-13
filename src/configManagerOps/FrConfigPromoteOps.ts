import { frodo } from '@rockcarver/frodo-lib';
import { printError, printMessage } from '../utils/Console';

const { readPromotionStatus, lockEnvironment, readLockStatus } =
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
 * Lock tenants and wait until they are locked.
 * @returns True if tenants were successfully locked, false otherwise.
 */
export async function configManagerLockTenants(): Promise<boolean> {
  try {
    await lockEnvironment();
    printMessage('Waiting for tenants to lock');
    let lockStatus = await readLockStatus();
    while (lockStatus.result !== 'locked') {
      await new Promise((resolve) =>
        setTimeout(resolve, POLL_INTERVAL_SECONDS * 1000)
      );

      lockStatus = await readLockStatus();
    }
    printMessage(
      JSON.stringify(
        {
          status: lockStatus.result,
          Promotionid: lockStatus.promotionId,
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
