import { frodo } from '@rockcarver/frodo-lib';
import { printError, printMessage } from '../utils/Console';

const { readPromotionStatus, lockEnvironment, readLockStatus } =
  frodo.cloud.env.promotion;
const POLL_INTERVAL_SECONDS = 60;

/**
 * Check promotion status.
 * @returns {Promise<boolean>} True if the status was retrieved successfully, false otherwise.
 */
export async function configManagerCheckPromotionStatus(): Promise<boolean> {
  try {
    const response = await readPromotionStatus();
    printMessage(response, 'data');
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

/**
 * Lock tenants and wait until they are locked.
 * @returns {Promise<boolean>} True if tenants were successfully locked, false otherwise.
 */
export async function configManagerLockTenants(): Promise<boolean> {
  try {
    const lockStatus = await lockEnvironment(true);
    printMessage(
      {
        status: lockStatus.result,
        Promotionid: lockStatus.promotionId,
      },
      'data'
    );
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}
