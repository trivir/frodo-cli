import { frodo } from '@rockcarver/frodo-lib';
import { printError, printMessage } from '../utils/Console';

const { readPromotionStatus, rollbackPromotion } = frodo.cloud.env.promotion;

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
 * Roll back the previous promotion.
 * @param {boolean} [unlockAfter=false] Whether to unlock environments after rollback.
 * @param {string} [promoter] Optional name of the person performing the rollback.
 * @param {string} [description] Optional description of the rollback.
 * @param {string} [ticketReference] Optional Zendesk ticket reference.
 * @returns {Promise<boolean>} True if the rollback request succeeds, false otherwise.
 */
export async function configManagerRollback(
  unlockAfter: boolean = false,
  promoter?: string,
  description?: string,
  ticketReference?: string
): Promise<boolean> {
  try {
    const response = await rollbackPromotion({
      unlockEnvironmentsAfterPromotion: unlockAfter,
      promoter: promoter ?? '',
      promotionDescription: description ?? '',
      zendeskTicketReference: ticketReference ?? '',
    });
    printMessage(response, 'data');
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}
