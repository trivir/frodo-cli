import fs from 'fs';
import { frodo } from '@rockcarver/frodo-lib';
import { extractFrConfigDataToFile } from '../utils/Config';
import { printError, printMessage } from '../utils/Console';

const { saveJsonToFile, getFilePath, readJsonFile } = frodo.utils;
const { readConfigEntity, importConfigEntities, updateConfigEntity } =
  frodo.idm.config;

/**
 * Export terms and conditions to file in fr-config-manager format
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function configManagerExportTermsAndConditions(): Promise<boolean> {
  try {
    const exportData = (await readConfigEntity('selfservice.terms')) as any;
    for (const version of exportData.versions) {
      for (const [language, text] of Object.entries(
        version.termsTranslations
      )) {
        const languageFileName = `${version.version}/${language}.html`;
        const directoryName = `terms-conditions`;
        version.termsTranslations[language] = extractFrConfigDataToFile(
          text,
          languageFileName,
          directoryName
        );
      }
    }
    saveJsonToFile(
      exportData,
      getFilePath('terms-conditions/terms-conditions.json', true),
      false
    );
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

/**
 * Import terms and conditions from fr-config-manager export
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function configManagerImportTermsAndConditions(): Promise<boolean> {
  try {
    const termsAndConditions = readJsonFile(
      getFilePath('terms-conditions/terms-conditions.json')
    ) as any;
    for (const version of termsAndConditions.versions) {
      for (const [language] of Object.entries(version.termsTranslations)) {
        const languageFileName = `${version.version}/${language}.html`;
        const directoryName = `terms-conditions`;
        const fileDir = getFilePath(`${directoryName}/${languageFileName}`);
        version.termsTranslations[language] = fs.readFileSync(fileDir, 'utf8');
      }
    }
    await importConfigEntities({
      idm: { [termsAndConditions._id]: termsAndConditions },
    });
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

/**
 * Delete terms and conditions versions.
 * @param {string} name Optional exact version identifier. If omitted, targets all versions.
 * @param {boolean} dryRun Show which versions would be deleted without updating the configuration.
 * @returns {Promise<boolean>} False if reading or any update fails; otherwise true.
 */
export async function configManagerDeleteTermsAndConditions(
  name?: string,
  dryRun: boolean = false
): Promise<boolean> {
  try {
    const terms = (await readConfigEntity('selfservice.terms')) as any;
    const versions = terms.versions;
    const selectedVersions = name
      ? versions.filter((entry) => entry.version === name)
      : versions;
    if (selectedVersions.length === 0) {
      printMessage(
        name
          ? `Warning: terms and conditions version '${name}' not found.`
          : 'No terms and conditions versions found to delete.',
        'warn'
      );
      return true;
    }
    let success = true;
    for (const { version: versionId } of selectedVersions) {
      if (dryRun) {
        printMessage(
          `Dry run: Deleting terms and conditions version: ${versionId}`
        );
        continue;
      }
      const nextVersions = terms.versions.filter(
        (entry) => entry.version !== versionId
      );
      try {
        terms.versions = nextVersions;
        await updateConfigEntity('selfservice.terms', terms);
        printMessage(`Deleting terms and conditions version: ${versionId}`);
      } catch (error) {
        printError(
          error,
          `Error deleting terms and conditions version ${versionId}`
        );
        success = false;
      }
    }
    return success;
  } catch (error) {
    printError(error, 'Error deleting terms and conditions versions');
    return false;
  }
}
