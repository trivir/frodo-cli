import { frodo } from '@rockcarver/frodo-lib';
import { printError, printMessage } from '../utils/Console';

const { readPromotionStatus, promoteConfiguration } = frodo.cloud.env.promotion;

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
 * Run a configuration promotion or dry-run promotion.
 * @param dryRun Whether to simulate the promotion.
 * @param ignoreEncryptedSecrets Whether to ignore encrypted secrets.
 * @param unlockAfter Whether to unlock environments after promotion.
 * @param promoter Name of the person performing the promotion.
 * @param description Description of the promotion.
 * @param ticketReference Zendesk ticket reference.
 * @returns true if successful, false otherwise.
 */
export async function configManagerRunPromotion(
  dryRun: boolean,
  ignoreEncryptedSecrets: boolean = false,
  unlockAfter: boolean = false,
  promoter?: string,
  description?: string,
  ticketReference?: string
): Promise<boolean> {
  try {
    const response = await promoteConfiguration({
      dryRun,
      ignoreEncryptedSecrets,
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
