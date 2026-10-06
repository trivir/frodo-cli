import fs from 'fs';
import { frodo } from '@rockcarver/frodo-lib';
import { extractFrConfigDataToFile } from '../utils/Config';
import { printError, printMessage } from '../utils/Console';
import { fileFilter } from '../utils/FrConfig';

const { readConfigEntitiesByType, importConfigEntities, deleteConfigEntity } =
  frodo.idm.config;
const { getFilePath, saveJsonToFile } = frodo.utils;
/**
 * Export schedules in fr-config-manager format.
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerExportSchedules(
  name?: string
): Promise<boolean> {
  try {
    const exportData = await readConfigEntitiesByType('schedule');
    processSchedules(exportData, 'schedules', name);
    return true;
  } catch (error) {
    printError(error, `Error exporting internal schedules to files`);
  }
  return false;
}

function processSchedules(schedules, fileDir, name?) {
  try {
    schedules.forEach((schedule) => {
      if (schedule._id !== 'scheduler') {
        const scheduleName = schedule._id.split('/')[1];
        if (name && name !== scheduleName) {
          return;
        }
        const scheduleDir = `${fileDir}/${scheduleName}`;
        const scriptFilename = `${scheduleName}.js`;
        if (
          schedule.invokeService === 'script' &&
          schedule.invokeContext.script.source
        ) {
          extractFrConfigDataToFile(
            schedule.invokeContext.script.source,
            scriptFilename,
            scheduleDir
          );
          delete schedule.invokeContext.script.source;
          schedule.invokeContext.script.file = `${scriptFilename}`;
        } else if (
          schedule.invokeService === 'taskscanner' &&
          schedule.invokeContext.task.script.source
        ) {
          extractFrConfigDataToFile(
            schedule.invokeContext.task.script.source,
            scriptFilename,
            scheduleDir
          );
          delete schedule.invokeContext.task.script.source;
          schedule.invokeContext.task.script.file = `${scriptFilename}`;
        }

        const scheduleFilename = `${scheduleDir}/${scheduleName}.json`;
        saveJsonToFile(
          schedule,
          getFilePath(scheduleFilename, true),
          false,
          true
        );
      }
    });
  } catch (err) {
    printError(err);
  }
}

/**
 * Import schedules in fr-config-manager format.
 * @param {string} schedulesName Optional name of the schedule to import. If not provided, imports all schedules.
 * @param {string} filenameFilter Optional filter to filter which scripts are imported.
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerImportSchedules(
  schedulesName?: string,
  filenameFilter?: string
): Promise<boolean> {
  try {
    const schedulesPath = getFilePath('schedules');
    const schedulesFiles = fs.readdirSync(schedulesPath);
    const importScheduleData = { idm: {} };
    for (const schedulesFile of schedulesFiles) {
      const jsonFilePath = getFilePath(
        `schedules/${schedulesFile}/${schedulesFile}.json`
      );
      if (!fs.existsSync(jsonFilePath)) continue;
      const readJsonSchedules = fs.readFileSync(jsonFilePath, 'utf8');
      const importData = JSON.parse(readJsonSchedules);
      const id = importData._id;
      if (schedulesName && id !== `schedule/${schedulesName}`) {
        continue;
      }
      if (
        importData.invokeService === 'script' &&
        importData.invokeContext?.script?.file
      ) {
        if (!fileFilter(importData.invokeContext.script.file, filenameFilter)) {
          continue;
        }
        const scriptPath = getFilePath(
          `schedules/${schedulesFile}/${importData.invokeContext.script.file}`
        );
        importData.invokeContext.script.source = fs.readFileSync(
          scriptPath,
          'utf8'
        );
        delete importData.invokeContext.script.file;
      } else if (
        importData.invokeService === 'taskscanner' &&
        importData.invokeContext?.task?.script?.file
      ) {
        if (
          !fileFilter(importData.invokeContext.task.script.file, filenameFilter)
        ) {
          continue;
        }
        const scriptPath = getFilePath(
          `schedules/${schedulesFile}/${importData.invokeContext.task.script.file}`
        );
        importData.invokeContext.task.script.source = fs.readFileSync(
          scriptPath,
          'utf8'
        );
        delete importData.invokeContext.task.script.file;
      }
      importScheduleData.idm[id] = importData;
    }
    await importConfigEntities(importScheduleData);
    return true;
  } catch (error) {
    printError(error, `Error importing internal schedules`);
  }
  return false;
}

/**
 * Delete schedules using fr-config-manager selection rules.
 * @param {string} name Optional exact schedule name. If omitted, targets all schedules.
 * @param {boolean} dryRun Show matching schedules without deleting them.
 * @returns {Promise<boolean>} False if reading or any deletion fails,
 * or if a named schedule is not found; otherwise true.
 */
export async function configManagerDeleteSchedules(
  name?: string,
  dryRun: boolean = false
): Promise<boolean> {
  try {
    const schedules = (await readConfigEntitiesByType('schedule')).filter(
      ({ _id }) =>
        typeof _id === 'string' &&
        _id.startsWith('schedule/') &&
        _id.slice('schedule/'.length).trim().length > 0
    );
    const selectedSchedules = name
      ? schedules.filter((schedule) => schedule._id === `schedule/${name}`)
      : schedules;
    if (selectedSchedules.length === 0) {
      if (name) {
        printMessage(`Warning: schedule '${name}' not found.`);
        return false;
      }
      printMessage('No schedules found to delete.');
      return true;
    }
    let success = true;
    for (const schedule of selectedSchedules) {
      const scheduleName = schedule._id.slice('schedule/'.length);

      if (dryRun) {
        printMessage(`Dry run: Deleting schedule: ${scheduleName}`);
        continue;
      }
      try {
        await deleteConfigEntity(schedule._id);
        printMessage(`Deleting schedule: ${scheduleName}`);
      } catch (error) {
        printError(error, `Error deleting schedule ${scheduleName}`);
        success = false;
      }
    }
    return success;
  } catch (error) {
    printError(error, 'Error deleting schedules');
    return false;
  }
}
