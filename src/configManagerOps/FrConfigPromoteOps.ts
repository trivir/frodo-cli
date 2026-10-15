import { frodo } from '@rockcarver/frodo-lib';
import { printError, printMessage } from '../utils/Console';

const { readPromotionStatus, readLockStatus } = frodo.cloud.env.promotion;

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
 * Check the current lock status of the tenants.
 * @returns true if successful, false otherwise.
 */
export async function configManagerCheckLockedStatus(): Promise<boolean> {
  try {
    const response = await readLockStatus();
    printMessage(JSON.stringify(response, null, 4));
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}
