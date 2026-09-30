import { frodo, FrodoError } from '@rockcarver/frodo-lib';
import { PolicySkeleton } from '@rockcarver/frodo-lib/types/api/cloud/iga/IgaSodPolicyApi';
import { PolicyExportInterface } from '@rockcarver/frodo-lib/types/ops/cloud/iga/IgaSodPolicyOps';
import fs from 'fs';

import {
  createKeyValueTable,
  createProgressIndicator,
  createTable,
  getTableRowsFromArray,
  printError,
  printMessage,
  stopProgressIndicator,
  updateProgressIndicator,
} from '../../../utils/Console';

const { getTypedFilename, saveJsonToFile, getFilePath, getWorkingDirectory } =
  frodo.utils;
const {
  importPolicy,
  readPolicies,
  readPolicyByName,
  exportPolicies,
  exportPoliciesByName,
  deletePolicyByName: _deletePolicyByName,
} = frodo.cloud.iga.sodPolicy;
const { readPolicyRule } = frodo.cloud.iga.sodPolicyRule;
/**
 * List all the policies
 * @param {boolean} long Long version, all the fields
 * @returns {Promise<boolean>} a promise resolving to true if successful, false otherwise
 */
export async function listPolicies(long: boolean = false): Promise<boolean> {
  let policies: PolicySkeleton[] = [];
  try {
    policies = await readPolicies();
    if (!long) {
      for (const policy of policies) {
        printMessage(`${policy.name}`, 'data');
      }
      return true;
    } else {
      const table = createTable([
        'ID',
        'Name',
        'Description',
        'Active',
        'Policy Owner',
        'Policy Rules',
      ]);
      for (const policy of policies) {
        table.push([
          policy.id,
          policy.name,
          policy.description ?? '',
          policy.active ? 'active'['brightGreen'] : 'inactive'['brightRed'],
          policy.policyOwner?.userName ?? '-',
          policy.policyRuleIds.length ?? 0,
        ]);
      }

      printMessage(table.toString(), 'data');
    }
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}

/**
 * Describe a policy
 * @param {string} name policy name
 * @param {string} file the policy export file
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function describePolicy(
  name?: string,
  file?: string
): Promise<boolean> {
  try {
    let policy: PolicySkeleton;

    if (file) {
      const data = fs.readFileSync(file, 'utf8');
      const policyExport: PolicyExportInterface = JSON.parse(data);
      const ids = Object.keys(policyExport.policy);
      if (ids.length === 0) {
        throw new FrodoError(`No policies found in export file ${file}`);
      }

      if (name) {
        const match = Object.values(policyExport.policy).find(
          (p) => p.name === name
        );
        if (!match) {
          throw new FrodoError(
            `No policy named '${name}' found in export file ${file}`
          );
        }
        policy = match;
      } else {
        policy = policyExport.policy[ids[0]];
      }
    } else if (name) {
      policy = await readPolicyByName(name);
    } else {
      const policies = await readPolicies();
      if (policies.length === 0) {
        throw new FrodoError(`No policies found`);
      }
      policy = policies[0];
    }

    const table = createKeyValueTable();
    table.push(['Id'['brightCyan'], policy.id]);
    table.push(['Name'['brightCyan'], policy.name]);
    table.push(['Description'['brightCyan'], policy.description ?? '']);
    table.push([
      'Status'['brightCyan'],
      policy.active ? 'active'['brightGreen'] : 'inactive'['brightRed'],
    ]);
    table.push([
      'Policy Owner'['brightCyan'],
      policy.policyOwner?.userName ?? '-',
    ]);

    let ruleLabels: string[];
    if (policy.policyRuleNames?.length) {
      ruleLabels = policy.policyRuleNames;
    } else if (policy.policyRuleIds?.length) {
      ruleLabels = [];
      for (const ruleId of policy.policyRuleIds) {
        try {
          const rule = await readPolicyRule(ruleId);
          ruleLabels.push(rule.name);
        } catch (e) {
          ruleLabels.push(`${ruleId} (not found)`);
          printError(e);
        }
      }
    } else {
      ruleLabels = [];
    }
    getTableRowsFromArray(
      table,
      `Policy Rules (${ruleLabels.length})`,
      ruleLabels
    );

    printMessage(table.toString() + '\n', 'data');
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}
/**
 * Export Policy to file
 * @param {string} name Policy name
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @param {boolean} extract extracts the scripts from the export into separate files if true. Default: false
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportPolicyToFile(
  name: string,
  file: string,
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false
): Promise<boolean> {
  const indicatorId = createProgressIndicator(
    'determinate',
    1,
    `Exporting ${name}...`
  );
  try {
    const policies = await readPolicies();
    const policy = policies.find((s) => s.name === name);
    if (!policy) {
      throw new FrodoError(`No policy named '${name}' found`);
    }
    const exportData = await exportPoliciesByName(policy.name);
    if (!file) {
      file = getTypedFilename(policy.name, 'policy');
    }
    const filePath = getFilePath(file, true);
    updateProgressIndicator(
      indicatorId,
      `Saving ${policy.name} to ${filePath}...`
    );
    saveJsonToFile(
      exportData,
      filePath,
      includeMeta,
      false,
      keepModifiedProperties
    );
    stopProgressIndicator(
      indicatorId,
      `Exported policy ${policy.name} to file`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error exporting policy ${name} to file`,
      'fail'
    );
    printError(error);
  }
  return false;
} /**
 * Export all Policies to file
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportPoliciesToFile(
  file: string,
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false
): Promise<boolean> {
  try {
    const exportData = await exportPolicies();
    if (!file) {
      file = getTypedFilename(`allPolicies`, 'policy');
    }
    saveJsonToFile(
      exportData,
      getFilePath(file, true),
      includeMeta,
      false,
      keepModifiedProperties
    );
    return true;
  } catch (error) {
    printError(error, `Error exporting policy to file`);
  }
  return false;
}

/**
 * Export all policies to separate files
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @param {boolean} extract extracts the scripts from the exports into separate files if true. Default: false
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportPoliciesToFiles(
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false
): Promise<boolean> {
  try {
    const exportData = await exportPolicies();
    for (const [id, policy] of Object.entries(exportData.policy)) {
      // single-policy envelope so each file holds only its own policy
      const fileExportData = {
        ...exportData,
        policy: { [id]: policy },
      };
      saveJsonToFile(
        fileExportData,
        getFilePath(getTypedFilename(policy.name, 'policy'), true),
        includeMeta,
        false,
        keepModifiedProperties
      );
    }
    return true;
  } catch (error) {
    printError(error, `Error exporting policies to files`);
  }
  return false;
}

/**
 * Import a policy from file
 * @param {string} name policy name
 * @param {string} file import file name
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importPolicyFromFile(
  name: string,
  file: string
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing policy...'
    );
    updateProgressIndicator(indicatorId, 'Importing policy...');
    const filePath = getFilePath(file);
    const importData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const existingPolicies = await readPolicies();
    const policies: PolicyExportInterface = { policy: {} };
    for (const id of Object.keys(importData.policy)) {
      const policy = importData.policy[id];
      if (policy.name !== name) continue;
      if (
        existingPolicies.find(
          (s) => s.id === policy.id || s.name === policy.name
        )
      )
        continue;
      policies.policy[id] = policy;
    }

    await importPolicy(policies);
    stopProgressIndicator(
      indicatorId,
      `Successfully imported policy ${name}.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing policy ${name}`,
      'fail'
    );
    printError(error);
  }
  return false;
}
/**
 * Import policies from file
 * @param {String} file file name

 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importPoliciesFromFile(file: string): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing policies...'
    );
    updateProgressIndicator(indicatorId, 'Importing policies...');
    const filePath = getFilePath(file);
    const importData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const existingPolicies = await readPolicies();
    const policies: PolicyExportInterface = { policy: {} };
    for (const id of Object.keys(importData.policy)) {
      const policy = importData.policy[id];
      if (
        existingPolicies.find(
          (s) => s.id === policy.id || s.name === policy.name
        )
      )
        continue;
      policies.policy[id] = policy;
    }

    await importPolicy(policies);
    stopProgressIndicator(
      indicatorId,
      `Successfully imported policies.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error importing policies.`, 'fail');
    printError(error, `Error importing policies from file`);
  }
  return false;
}

/**
 * Import all policies from separate files
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importPoliciesFromFiles(): Promise<boolean> {
  let indicatorId: string;
  const errors: Error[] = [];
  try {
    const names = fs.readdirSync(getWorkingDirectory());
    const policyFiles = names.filter((name) =>
      name.toLowerCase().endsWith('.policy.json')
    );
    indicatorId = createProgressIndicator(
      'determinate',
      policyFiles.length,
      'Importing policies...'
    );

    const existingPolicies = await readPolicies();

    for (const file of policyFiles) {
      try {
        updateProgressIndicator(
          indicatorId,
          `Importing policy from file ${file}...`
        );
        const importData = JSON.parse(
          fs.readFileSync(getFilePath(file), 'utf8')
        );

        const policies: PolicyExportInterface = { policy: {} };
        for (const id of Object.keys(importData.policy)) {
          const policy = importData.policy[id];
          if (
            existingPolicies.find(
              (s) => s.id === policy.id || s.name === policy.name
            )
          )
            continue;
          policies.policy[id] = policy;
        }

        await importPolicy(policies);
      } catch (error) {
        errors.push(
          new FrodoError(`Error importing policies from ${file}`, error)
        );
      }
    }
    if (errors.length > 0)
      throw new FrodoError(`One or more errors importing policies`, errors);
    stopProgressIndicator(
      indicatorId,
      `Successfully imported policies.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error(s) importing policies.`, 'fail');
    printError(error, `Error importing policies from files`);
  }
  return false;
}
/**
 * Import first policy from file
 * @param {string} file import file name
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importFirstPolicyFromFile(
  file: string
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing policy...'
    );
    const filePath = getFilePath(file);
    const importData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const ids = Object.keys(importData.policy);
    if (ids.length === 0)
      throw new FrodoError(`No policies found in import data`);

    const existingPolicies = await readPolicies();
    const policies: PolicyExportInterface = { policy: {} };
    for (const id of ids) {
      const policy = importData.policy[id];
      if (
        existingPolicies.find(
          (s) => s.id === policy.id || s.name === policy.name
        )
      )
        continue;
      policies.policy[id] = policy;
      break; // only first
    }

    await importPolicy(policies);
    stopProgressIndicator(
      indicatorId,
      `Imported policy from ${file}`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing policy from ${file}`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Delete policy by name.
 * @param {string} name policy name
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function deletePolicyByName(name: string): Promise<boolean> {
  const spinnerId = createProgressIndicator(
    'indeterminate',
    undefined,
    `Deleting policy ${name}...`
  );
  try {
    const result = await _deletePolicyByName(name);
    if (!result) {
      throw new FrodoError(`Failed to delete policy ${name}`);
    }
    stopProgressIndicator(spinnerId, `Deleted policy ${name}.`, 'success');
    return true;
  } catch (error) {
    stopProgressIndicator(spinnerId, `Error: ${error.message}`, 'fail');
    printError(error);
  }
  return false;
}
