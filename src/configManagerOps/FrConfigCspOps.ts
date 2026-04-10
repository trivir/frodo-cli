import { frodo } from '@rockcarver/frodo-lib';
import { ContentSecurityPolicy } from '@rockcarver/frodo-lib/types/api/cloud/EnvContentSecurityPolicyApi';
import { applyDiff } from 'deep-diff';
import fs from 'fs';
import { readFile } from 'fs/promises';

import { printError } from '../utils/Console';

const { env } = frodo.cloud;
const {
  updateEnforcedContentSecurityPolicy,
  updateReportOnlyContentSecurityPolicy,
} = frodo.cloud.env;
const { getFilePath, saveJsonToFile } = frodo.utils;

/**
 * Export the content security policy in fr-config manager format
 * @returns True if file was successfully saved
 */
export async function configManagerExportCsp(
  file: string = null
): Promise<boolean> {
  try {
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
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

/**
 * Import the content security policy in fr-config manager format
 * @param name optional csp name to import
 * @returns True if file was successfully saved
 */
export async function configManagerImportCsp(name?: string): Promise<boolean> {
  try {
    if (name) {
      const getCspFile = getFilePath(`csp/${name}.json`);
      const readCspFile = fs.readFileSync(getCspFile, 'utf8');
      const csp = JSON.parse(readCspFile);

      await updateEnforcedContentSecurityPolicy(csp.enforced);
      await updateReportOnlyContentSecurityPolicy(csp['report-only']);
    } else {
      const getCspFile = getFilePath('csp/csp.json');
      const readCspFile = fs.readFileSync(getCspFile, 'utf8');
      const csp = JSON.parse(readCspFile);

      await updateEnforcedContentSecurityPolicy(csp.enforced);
      await updateReportOnlyContentSecurityPolicy(csp['report-only']);
    }

    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}
