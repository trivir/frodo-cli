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
 * Check promotion reports.
 * @param list Whether to list all promotion reports.
 * @param reportId ID of a specific promotion report.
 * @param provisional Whether to retrieve the provisional promotion report.
 * @param provisionalRollback Whether to retrieve the provisional rollback report.
 * @returns True if successful, false otherwise.
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
    printMessage(JSON.stringify(response, null, 4));
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}
