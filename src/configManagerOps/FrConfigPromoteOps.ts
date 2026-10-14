import { frodo } from '@rockcarver/frodo-lib';
import { printError, printMessage } from '../utils/Console';

const { readPromotionStatus, rollbackPromotion } = frodo.cloud.env.promotion;

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
 * Roll back the previous promotion.
 * @param unlockAfter Whether to unlock environments after rollback.
 * @param promoter Name of the person performing the rollback.
 * @param description Description of the rollback.
 * @param ticketReference Zendesk ticket reference.
 * @returns True if the rollback request succeeds, false otherwise.
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
    printMessage(JSON.stringify(response, null, 4));
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}
