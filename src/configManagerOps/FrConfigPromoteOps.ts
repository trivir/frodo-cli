import { frodo } from '@rockcarver/frodo-lib';
import { printError, printMessage } from '../utils/Console';

const {
  readPromotionStatus,
  runProvisionalPromotionReport,
  runProvisionalRollbackReport,
  readPromotionReport,
  readPromotionReports,
  readLastPromotionReport,
} = frodo.cloud.env.promotion;

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
 * Check promotion reports.
 * @param {boolean} list Whether to list all promotion reports.
 * @param {string} [reportId] Optional ID of a specific promotion report.
 * @param {boolean} provisional Whether to retrieve the provisional promotion report.
 * @param {boolean} provisionalRollback Whether to retrieve the provisional rollback report.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export async function configManagerCheckPromotionReports(
  list: boolean = false,
  reportId?: string,
  provisional: boolean = false,
  provisionalRollback: boolean = false
): Promise<boolean> {
  try {
    let response;
    if (provisional) {
      response = await runProvisionalPromotionReport();
    } else if (provisionalRollback) {
      response = await runProvisionalRollbackReport();
    } else if (reportId) {
      response = await readPromotionReport(reportId);
    } else if (list) {
      response = await readPromotionReports();
    } else {
      response = await readLastPromotionReport();
    }
    printMessage(response, 'data');
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}
