import { frodo, FrodoError } from '@rockcarver/frodo-lib';
import { EventSkeleton } from '@rockcarver/frodo-lib/types/api/cloud/iga/IgaEventApi';
import {
  EventExportInterface,
  EventExportOptions,
  EventImportOptions,
} from '@rockcarver/frodo-lib/types/ops/cloud/iga/IgaEventOps';
import fs from 'fs';

import { extractDataToFile } from '../../../utils/Config';
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
import * as EmailTemplate from '../../EmailTemplateOps';
import { errorHandler } from '../../utils/OpsUtils';

const {
  getTypedFilename,
  saveToFile,
  saveJsonToFile,
  getFilePath,
  getWorkingDirectory,
} = frodo.utils;
const {
  importEvents,
  readEvents,
  exportEvent,
  exportEvents,
  deleteEvent: _deleteEvent,
  deleteEvents: _deleteEvents
} = frodo.cloud.iga.event;
/**
 * List all the events
 * @param {boolean} long Long version, all the fields
 * @returns {Promise<boolean>} a promise resolving to true if successful, false otherwise
 */
export async function listEvents(long: boolean = false, listId: boolean = false, listName: boolean = false): Promise<boolean> {
  let events: EventSkeleton[] = [];
  try {
    events = await readEvents();
    if (!long) {
      if (listId && listName) {
        const table = createTable([
          'ID',
          'Name'
        ]);
        for (const event of events) {
          table.push([
            `${event.id}`,
            event.name
          ]);
        }
        printMessage(table.toString(), 'data');
      } else {
        for (const event of events) {
          const defaultId = listId === false && listName === false;
          let display = listId || defaultId ? event.id : event.name;

          printMessage(
            display,
            'data'
          );
        }
      }
      return true;
    }
    const table = createTable([
      'ID',
      'Name',
      'MutationType',
      'Status'
    ]);
    for (const event of events) {
      table.push([
        `${event.id}`,
        event.name,
        event.mutationType,
        event.status ? 'active'['brightGreen'] : 'inactive'['brightRed']
      ]);
    }
    printMessage(table.toString(), 'data');
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}

/**
 * Describe a event
 * @param {string} eventId event id
 * @param {string} file the event export file
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function describeEvent(
  eventId?: string,
  file?: string
): Promise<boolean> {
  try {
    const eventExport = file
      ? getEventExportFromFile(getFilePath(file))
      : await exportEvent(eventId, { deps: true });
    if (!eventId) {
      const ids = Object.keys(eventExport.event);
      if (ids.length === 0)
        throw new FrodoError(`No events found in export file ${file}`);
      eventId = ids[0];
    }
    // Event Details
    const event = eventExport.event[eventId];
    printMessage(
      `${event.status.charAt(0).toUpperCase() + event.status.slice(1)} Event`,
      'data'
    );

    const table = createKeyValueTable();
    table.push(['Id'['brightCyan'], event.id]);
    table.push(['Name'['brightCyan'], event.name]);
    table.push(['Description'['brightCyan'], event.description]);
    getTableRowsFromArray(
      table,
      `Owners (${event.owners.length})`,
      event.owners.map((s) => s.givenName)
    );
    table.push(['EntityType'['brightCyan'], event.entityType]);
    table.push(['MutationType'['brightCyan'], event.mutationType]);
    if (event.condition.version) table.push(['Version'['brightCyan'], event.condition.version]);
    if (event.condition.filter) table.push(['Filter'['brightCyan'], event.condition.filter]);
    table.push(['Status'['brightCyan'], event.status]);
    if (event.metadata) {
      table.push(['CreatedDate'['brightCyan'], event.metadata.createdDate]);
      table.push(['ModifiedDate'['brightCyan'], event.metadata.modifiedDate]);
    }
    printMessage(table.toString() + '\n', 'data');

    // Email Templates
    if (Object.entries(eventExport.emailTemplate).length) {
      printMessage(
        `\nEmail Templates (${
          Object.entries(eventExport.emailTemplate).length
        }):`,
        'data'
      );
      for (const templateData of Object.values(eventExport.emailTemplate)) {
        printMessage(
          `- ${EmailTemplate.getOneLineDescription(templateData)}`,
          'data'
        );
      }
    }
    // Events
    if (Object.entries(eventExport.event).length) {
      printMessage(
        `\nEvents (${Object.entries(eventExport.event).length}):`,
        'data'
      );
      for (const eventData of Object.values(eventExport.event)) {
        printMessage(
          `- [${eventData.id['brightCyan']}] ${eventData.name}`,
          'data'
        );
      }
    }
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}

/**
 * Export event to file
 * @param {string} eventId event id
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @param {boolean} extract extracts the event from the export into separate files if true. Default: false
 * @param {eventExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportEventToFile(
  eventId: string,
  file: string,
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false,
  extract: boolean = false,
  options: EventExportOptions = { deps: true }
): Promise<boolean> {
  const indicatorId = createProgressIndicator(
    'determinate',
    1,
    `Exporting ${eventId}...`
  );
  try {
    const exportData = await exportEvent(eventId, options);
    if (!file) {
      file = getTypedFilename(eventId, 'event');
    }
    const filePath = getFilePath(file, true);
    if (extract) extractEventToFiles(exportData);
    updateProgressIndicator(
      indicatorId,
      `Saving ${eventId} to ${filePath}...`
    );
    saveJsonToFile(exportData, filePath, includeMeta, false, keepModifiedProperties);
    stopProgressIndicator(
      indicatorId,
      `Exported event ${eventId} to file`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error exporting event ${eventId} to file`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Export all events to file
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @param {EventExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportEventsToFile(
  file: string,
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false,
  options: EventExportOptions = { deps: true }
): Promise<boolean> {
  try {
    const exportData = await exportEvents(options, errorHandler);
    if (!file) {
      file = getTypedFilename(`allEvents`, 'event');
    }
    saveJsonToFile(exportData, getFilePath(file, true), includeMeta, false, keepModifiedProperties);
    return true;
  } catch (error) {
    printError(error, `Error exporting events to file`);
  }
  return false;
}

/**
 * Export all events to separate files
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @param {boolean} extract extracts the event from the exports into separate files if true. Default: false
 * @param {EventExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportEventsToFiles(
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false,
  extract: boolean = false,
  options: EventExportOptions = { deps: true }
): Promise<boolean> {
  try {
    const exportData = await exportEvents(options, errorHandler);
    if (extract) extractEventToFiles(exportData);
    for (const [eventId, eventGroup] of Object.entries(
      exportData.event
    )) {
      saveToFile(
        'event',
        eventGroup,
        'id',
        getFilePath(getTypedFilename(eventId, 'event'), true),
        includeMeta,
        keepModifiedProperties
      );
    }
    return true;
  } catch (error) {
    printError(error, `Error exporting events to files`);
  }
  return false;
}

/**
 * Import a event from file
 * @param {string} eventId event id
 * @param {string} file import file name
 * @param {EventImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importEventFromFile(
  eventId: string,
  file: string,
  options: EventImportOptions = {
    deps: true,
  }
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing event...'
    );
    const importData = getEventExportFromFile(getFilePath(file));
    updateProgressIndicator(indicatorId, 'Importing event...');
    await importEvents(importData, eventId, undefined, options);
    stopProgressIndicator(
      indicatorId,
      `Successfully imported event ${eventId}.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing event ${eventId}`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Import events from file
 * @param {String} file file name
 * @param {EventImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importEventsFromFile(
  file: string,
  options: EventImportOptions = {
    deps: true,
  }
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing events...'
    );
    const importData = getEventExportFromFile(getFilePath(file));
    updateProgressIndicator(indicatorId, 'Importing events...');
    await importEvents(importData, undefined, undefined, options, errorHandler);
    stopProgressIndicator(
      indicatorId,
      `Successfully imported events.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error importing events.`, 'fail');
    printError(error, `Error importing events from file`);
  }
  return false;
}

/**
 * Import all events from separate files
 * @param {EventImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importEventsFromFiles(
  options: EventImportOptions = {
    deps: true,
  }
): Promise<boolean> {
  let indicatorId: string;
  const errors: Error[] = [];
  try {
    const names = fs.readdirSync(getWorkingDirectory());
    const eventFiles = names.filter((name) =>
      name.toLowerCase().endsWith('.event.json')
    );
    indicatorId = createProgressIndicator(
      'determinate',
      eventFiles.length,
      'Importing events...'
    );
    for (const file of eventFiles) {
      try {
        updateProgressIndicator(
          indicatorId,
          `Importing events from file ${file}...`
        );
        await importEventsFromFile(file, options);
      } catch (error) {
        errors.push(
          new FrodoError(`Error importing events from ${file}`, error)
        );
      }
    }
    if (errors.length > 0) {
      throw new FrodoError(`One or more errors importing events`, errors);
    }
    stopProgressIndicator(
      indicatorId,
      `Successfully imported events.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error(s) importing events.`, 'fail');
    printError(error, `Error importing events from files`);
  }
  return false;
}

/**
 * Import first event from file
 * @param {string} file import file name
 * @param {EventImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importFirstEventFromFile(
  file: string,
  options: EventImportOptions = {
    deps: true,
  }
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing event...'
    );
    const importData = getEventExportFromFile(getFilePath(file));
    const ids = Object.keys(importData.event);
    if (ids.length === 0)
      throw new FrodoError(`No events found in import data`);
    await importEvents(importData, ids[0], undefined, options);
    stopProgressIndicator(
      indicatorId,
      `Imported event from ${file}`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing event from ${file}`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Delete event
 * @param {string} eventId event id
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function deleteEvent(eventId: string): Promise<boolean> {
  const spinnerId = createProgressIndicator(
    'indeterminate',
    undefined,
    `Deleting event ${eventId}...`
  );
  try {
    await _deleteEvent(eventId);
    stopProgressIndicator(
      spinnerId,
      `Deleted event ${eventId}.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(spinnerId, `Error: ${error.message}`, 'fail');
    printError(error);
  }
  return false;
}

/**
 * Delete events
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function deleteEvents(): Promise<boolean> {
  const spinnerId = createProgressIndicator(
    'indeterminate',
    undefined,
    `Deleting events...`
  );
  try {
    await _deleteEvents(errorHandler);
    stopProgressIndicator(spinnerId, `Deleted events.`, 'success');
    return true;
  } catch (error) {
    stopProgressIndicator(spinnerId, `Error: ${error.message}`, 'fail');
    printError(error);
  }
  return false;
}

/**
 * Get a event export from json file.
 *
 * @param file The path to the event export file
 * @returns The event export
 */
export function getEventExportFromFile(
  file: string
): EventExportInterface {
  const exportData = JSON.parse(
    fs.readFileSync(file, 'utf8')
  ) as EventExportInterface;
  return exportData;
}

/**
 * Extracts events from an event export into separate files.
 * @param {EventExportInterface} exportData The event export
 * @param {string} eventId The event id to extract a specific event from. If undefined, will extract event from all events.
 * @param {string} directory The directory within the base directory to save the event files
 * @returns {boolean} true if successful, false otherwise
 */
export function extractEventToFiles(
  exportData: EventExportInterface,
  eventId?: string,
  directory?: string
): boolean {
  try {
    const events = eventId
      ? [exportData.event[eventId]]
      : Object.values(exportData.event);
    for (const event of events) {
      const eventDirectory = `${directory ? directory + '/' : ''}${event.id}/${event.status}`;
      const fileName = getTypedFilename(event.name, 'event', 'js');
      extractDataToFile(event, `${eventDirectory}/${fileName}`);
    }
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}
