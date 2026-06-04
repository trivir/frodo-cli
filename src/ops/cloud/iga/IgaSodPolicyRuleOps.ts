import { frodo, FrodoError } from '@rockcarver/frodo-lib';
import { PolicyRuleSkeleton } from '@rockcarver/frodo-lib/types/api/cloud/iga/IgaSodPolicyRulesApi';
import { PolicyRuleExportInterface } from '@rockcarver/frodo-lib/types/ops/cloud/iga/IgaSodPolicyRuleOps';
import fs from 'fs';

import {
  createKeyValueTable,
  createProgressIndicator,
  createTable,
  printError,
  printMessage,
  stopProgressIndicator,
  updateProgressIndicator,
} from '../../../utils/Console';

const { getTypedFilename, saveJsonToFile, getFilePath, getWorkingDirectory } =
  frodo.utils;
const {
  readPolicyRuleByName,
  readPolicyRules,
  importPolicyRule,
  exportPolicyRuleByName,
  exportPolicyRules,
  deletePolicyRuleByName: _deletePolicyRuleByName,
} = frodo.cloud.iga.sodPolicyRule;

/**
 * List all the policy rules
 * @param {boolean} long Long version, all the fields
 * @returns {Promise<boolean>} a promise resolving to true if successful, false otherwise
 */
export async function listPolicyRules(long: boolean = false): Promise<boolean> {
  let policyRules: PolicyRuleSkeleton[] = [];
  try {
    policyRules = await readPolicyRules();
    if (!long) {
      for (const policy of policyRules) {
        printMessage(`${policy.name}`, 'data');
      }
      return true;
    } else {
      const table = createTable([
        'ID',
        'Name',
        'Description',
        'Active',
        'Owner',
        'Risk Score',
      ]);
      for (const rule of policyRules) {
        table.push([
          rule.id,
          rule.name,
          rule.description ?? '',
          rule.active ? 'active'['brightGreen'] : 'inactive'['brightRed'],
          rule.policyRuleOwner?.userName ?? '-',
          rule.riskScore ?? '-',
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
 * Describe a policy rule
 * @param {string} name policy rule name
 * @param {string} file the policy rule export file
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function describePolicyRule(
  name?: string,
  file?: string
): Promise<boolean> {
  try {
    let rule: PolicyRuleSkeleton;

    if (file) {
      const data = fs.readFileSync(file, 'utf8');
      const ruleExport: PolicyRuleExportInterface = JSON.parse(data);
      const ids = Object.keys(ruleExport.policyRule);
      if (ids.length === 0) {
        throw new FrodoError(`No policy rules found in export file ${file}`);
      }
      if (name) {
        const match = Object.values(ruleExport.policyRule).find(
          (p) => p.name === name
        );
        if (!match) {
          throw new FrodoError(
            `No policy named '${name}' found in export file ${file}`
          );
        }
        rule = match;
      } else {
        rule = ruleExport.policyRule[ids[0]];
      }
    } else if (name) {
      rule = await readPolicyRuleByName(name);
    } else {
      const policies = await readPolicyRules();
      if (policies.length === 0) {
        throw new FrodoError(`No policy rules found`);
      }
      rule = policies[0];
    }

    const table = createKeyValueTable();
    table.push(['Id'['brightCyan'], rule.id]);
    table.push(['Name'['brightCyan'], rule.name]);
    table.push(['Description'['brightCyan'], rule.description ?? '']);
    table.push([
      'Active'['brightCyan'],
      rule.active ? 'active'['brightGreen'] : 'inactive'['brightRed'],
    ]);
    table.push([
      'Rule Owner'['brightCyan'],
      rule.policyRuleOwner?.userName ?? '-',
    ]);
    table.push([
      'Violation Owner'['brightCyan'],
      rule.violationOwner?.userName ?? '-',
    ]);
    table.push(['Risk Score'['brightCyan'], rule.riskScore ?? '-']);
    table.push([
      'Max Exception Duration'['brightCyan'],
      rule.maxExceptionDuration ?? '-',
    ]);

    const scanTypes = rule.scanTypes
      ? Object.entries(rule.scanTypes)
          .filter(([, v]) => v === true)
          .map(([k]) => k)
      : [];
    table.push([
      'Scan Types'['brightCyan'],
      scanTypes.length ? scanTypes.join(', ') : '-',
    ]);

    const decisionOptions = rule.decisionOptions
      ? Object.entries(rule.decisionOptions)
          .filter(([, v]) => v === true)
          .map(([k]) => k)
      : [];
    table.push([
      'Decision Options'['brightCyan'],
      decisionOptions.length ? decisionOptions.join(', ') : '-',
    ]);

    table.push([
      'Workflow'['brightCyan'],
      rule.workflow ? `${rule.workflow.id} (${rule.workflow.type})` : '-',
    ]);

    printMessage(table.toString() + '\n', 'data');
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}
/**
 * Export a policy rule to file
 * @param {string} name policy rule name
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportPolicyRuleToFile(
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
    const exportData = await exportPolicyRuleByName(name);
    if (!file) {
      file = getTypedFilename(name, 'rule');
    }
    const filePath = getFilePath(file, true);
    updateProgressIndicator(indicatorId, `Saving ${name} to ${filePath}...`);
    saveJsonToFile(
      exportData,
      filePath,
      includeMeta,
      false,
      keepModifiedProperties
    );
    stopProgressIndicator(
      indicatorId,
      `Exported policy rule ${name} to file`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error exporting policy rule ${name} to file`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Export all policy rules to a single file
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportPolicyRulesToFile(
  file: string,
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false
): Promise<boolean> {
  try {
    const exportData = await exportPolicyRules();
    if (!file) {
      file = getTypedFilename(`allPolicyRule`, 'rule');
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
    printError(error, `Error exporting policy rules to file`);
  }
  return false;
}

/**
 * Export all policy rules to separate files
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportPolicyRulesToFiles(
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false
): Promise<boolean> {
  try {
    const exportData = await exportPolicyRules();
    for (const [id, rule] of Object.entries(exportData.policyRule)) {
      // build a single-rule envelope so each file holds only its own rule
      const fileExportData = {
        ...exportData,
        policyRule: { [id]: rule },
      };
      saveJsonToFile(
        fileExportData,
        getFilePath(getTypedFilename(rule.name, 'rule'), true),
        includeMeta,
        false,
        keepModifiedProperties
      );
    }
    return true;
  } catch (error) {
    printError(error, `Error exporting policy rules to files`);
  }
  return false;
}
/**
 * Import a policy rule from file
 * @param {string} name policy name
 * @param {string} file import file name
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importPolicyRuleFromFile(
  name: string,
  file: string
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing policy rule...'
    );
    updateProgressIndicator(indicatorId, 'Importing policy rule...');
    const filePath = getFilePath(file);
    const importData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const existingRules = await readPolicyRules();
    const rules: PolicyRuleExportInterface = { policyRule: {} };
    for (const id of Object.keys(importData.policyRule)) {
      const rule = importData.policyRule[id];
      if (rule.name !== name) continue;
      if (existingRules.find((s) => s.id === rule.id || s.name === rule.name))
        continue;
      rules.policyRule[id] = rule;
    }

    await importPolicyRule(rules);
    stopProgressIndicator(
      indicatorId,
      `Successfully imported policy rule ${name}.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing policy rule ${name}`,
      'fail'
    );
    printError(error);
  }
  return false;
}
/**
 * Import policy rules from file
 * @param {String} file file name

 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importPolicyRulesFromFile(
  file: string
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing policy rules...'
    );
    updateProgressIndicator(indicatorId, 'Importing policy rules...');
    const filePath = getFilePath(file);
    const importData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const existingRules = await readPolicyRules();
    const rules: PolicyRuleExportInterface = { policyRule: {} };
    for (const id of Object.keys(importData.policyRule)) {
      const rule = importData.policyRule[id];
      if (existingRules.find((s) => s.id === rule.id || s.name === rule.name))
        continue;
      rules.policyRule[id] = rule;
    }

    await importPolicyRule(rules);
    stopProgressIndicator(
      indicatorId,
      `Successfully imported policy rules.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error importing policy rules.`, 'fail');
    printError(error, `Error importing policy rules from file`);
  }
  return false;
}
export async function importPolicyRulesFromFiles(): Promise<boolean> {
  let indicatorId: string;
  const errors: Error[] = [];
  try {
    const names = fs.readdirSync(getWorkingDirectory());
    const ruleFiles = names.filter((name) =>
      name.toLowerCase().endsWith('.rule.json')
    );
    indicatorId = createProgressIndicator(
      'determinate',
      ruleFiles.length,
      'Importing policy rules...'
    );

    const existingRules = await readPolicyRules();

    for (const file of ruleFiles) {
      try {
        updateProgressIndicator(
          indicatorId,
          `Importing policy rule from file ${file}...`
        );
        const importData = JSON.parse(
          fs.readFileSync(getFilePath(file), 'utf8')
        );

        if (!importData.policyRule) {
          throw new FrodoError(
            `File ${file} is not a policy rule export (no 'policyRule' key)`
          );
        }

        const rules: PolicyRuleExportInterface = { policyRule: {} };
        for (const id of Object.keys(importData.policyRule)) {
          const rule = importData.policyRule[id];
          if (
            existingRules.find((s) => s.id === rule.id || s.name === rule.name)
          )
            continue;
          rules.policyRule[id] = rule;
        }

        await importPolicyRule(rules);
      } catch (error) {
        errors.push(
          new FrodoError(`Error importing policy rules from ${file}`, error)
        );
      }
    }
    if (errors.length > 0)
      throw new FrodoError(`One or more errors importing policy rules`, errors);
    stopProgressIndicator(
      indicatorId,
      `Successfully imported policy rules.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error(s) importing policy rules.`,
      'fail'
    );
    printError(error, `Error importing policy rules from files`);
  }
  return false;
} /**
 * Import first policy rule from file
 * @param {string} file import file name
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importFirstPolicyRuleFromFile(
  file: string
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing policy rule...'
    );
    const filePath = getFilePath(file);
    const importData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const ids = Object.keys(importData.policyRule);
    if (ids.length === 0)
      throw new FrodoError(`No policy rules found in import data`);

    const existingRules = await readPolicyRules();
    const rules: PolicyRuleExportInterface = { policyRule: {} };
    for (const id of ids) {
      const rule = importData.policyRule[id];
      if (existingRules.find((s) => s.id === rule.id || s.name === rule.name))
        continue;
      rules.policyRule[id] = rule;
      break;
    }

    await importPolicyRule(rules);
    stopProgressIndicator(
      indicatorId,
      `Imported policy rule from ${file}`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing policy rule from ${file}`,
      'fail'
    );
    printError(error);
  }
  return false;
}
/**
 * Delete policy rule by name.
 * @param {string} name policy name
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function deletePolicyRuleByName(name: string): Promise<boolean> {
  const spinnerId = createProgressIndicator(
    'indeterminate',
    undefined,
    `Deleting policy ${name}...`
  );
  try {
    const result = await _deletePolicyRuleByName(name);
    if (!result) {
      throw new FrodoError(`Failed to delete policy rule ${name}`);
    }
    stopProgressIndicator(spinnerId, `Deleted policy rule ${name}.`, 'success');
    return true;
  } catch (error) {
    stopProgressIndicator(spinnerId, `Error: ${error.message}`, 'fail');
    printError(error);
  }
  return false;
}
