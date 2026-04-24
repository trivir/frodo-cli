import { frodo } from '@rockcarver/frodo-lib';
import { ContentSecurityPolicy } from '@rockcarver/frodo-lib/types/api/cloud/EnvContentSecurityPolicyApi';
import { applyDiff } from 'deep-diff';
import { readFile } from 'fs/promises';

import {
  createProgressIndicator,
  printError,
  stopProgressIndicator,
} from '../utils/Console';

const { env } = frodo.cloud;
const { getFilePath, saveJsonToFile } = frodo.utils;

/**
 * Export the content security policy in fr-config manager format
 * @returns True if file was successfully saved
 */
export async function configManagerExportCsp(
  file: string = null
): Promise<boolean> {
  let indicatorId: string | undefined;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Exporting content security policies'
    );
    const cspEnforced: ContentSecurityPolicy =
      await env.readEnforcedContentSecurityPolicy();
    const cspReport: ContentSecurityPolicy =
      await env.readReportOnlyContentSecurityPolicy();
    const csp = { enforced: cspEnforced, 'report-only': cspReport };

    if (file) {
      const configFileData = JSON.parse(
        await readFile(file, { encoding: 'utf8' })
      );
      applyDiff(
        csp,
        configFileData,
        (_source, _target, change) => change.kind !== 'D'
      );
    }

    saveJsonToFile(csp, getFilePath('csp/csp.json', true), false, true);
    stopProgressIndicator(indicatorId, 'Exported content security policies');
    return true;
  } catch (error) {
    if (indicatorId) {
      stopProgressIndicator(
        indicatorId,
        'Error exporting content security policies',
        'fail'
      );
    }
    printError(error);
    return false;
  }
}
