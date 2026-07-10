import { frodo } from '@rockcarver/frodo-lib';
import { ContentSecurityPolicy } from '@rockcarver/frodo-lib/types/api/cloud/EnvContentSecurityPolicyApi';
import { applyDiff } from 'deep-diff';
import { readFile } from 'fs/promises';

import { printError } from '../utils/Console';

const { env } = frodo.cloud;
const { getFilePath, saveJsonToFile } = frodo.utils;

/**
 * Export the content security policy in fr-config manager format
 * @param {string} file file for csp override
 * @param {string} name csp name
 * @returns True if file was successfully saved
 */
export async function configManagerExportCsp(
  file: string = null,
  name?: string
): Promise<boolean> {
  try {
    let csp: Record<string, ContentSecurityPolicy>;
    if (name && name !== 'enforced' && name !== 'report-only') {
      throw new Error(`Unknown CSP: ${name}`);
    }
    if (name === 'enforced') {
      csp = {
        enforced: await env.readEnforcedContentSecurityPolicy(),
      };
    } else if (name === 'report-only') {
      csp = {
        'report-only': await env.readReportOnlyContentSecurityPolicy(),
      };
    } else {
      csp = {
        enforced: await env.readEnforcedContentSecurityPolicy(),
        'report-only': await env.readReportOnlyContentSecurityPolicy(),
      };
    }

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
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}
