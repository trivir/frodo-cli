import { frodo, state } from '@rockcarver/frodo-lib';
import { type NodeSkeleton } from '@rockcarver/frodo-lib/types/api/NodeApi';
import { type TreeSkeleton } from '@rockcarver/frodo-lib/types/api/TreeApi';
import {
  type JourneyClassificationType,
  type MultiTreeExportInterface,
  type SingleTreeExportInterface,
  type TreeDependencyMapInterface,
  type TreeExportOptions,
  type TreeExportResolverInterface,
  type TreeImportOptions,
} from '@rockcarver/frodo-lib/types/ops/JourneyOps';
import fs from 'fs';

import {
  createProgressIndicator,
  createTable,
  debugMessage,
  printMessage,
  stopProgressIndicator,
  updateProgressIndicator,
} from '../utils/Console';
import * as CirclesOfTrust from './CirclesOfTrustOps';
import * as EmailTemplate from './EmailTemplateOps';
import * as Idp from './IdpOps';
import * as Node from './NodeOps';
import * as Saml2 from './Saml2Ops';
import * as Script from './ScriptOps';
import * as Theme from './ThemeOps';
import { cloneDeep } from './utils/OpsUtils';
import wordwrap from './utils/Wordwrap';

const {
  getTypedFilename,
  saveJsonToFile,
  getRealmString,
  getFilePath,
  getWorkingDirectory,
} = frodo.utils;
const {
  readJourneys,
  exportJourney,
  exportJourneys,
  resolveDependencies,
  importJourneys,
  importJourney,
  getTreeDescendents,
  getNodeRef,
  onlineTreeExportResolver,
  getJourneyClassification: _getJourneyClassification,
  disableJourney: _disableJourney,
  enableJourney: _enableJourney,
} = frodo.authn.journey;

/**
 * List all the journeys/trees
 * @param {boolean} long Long version, all the fields
 * @param {boolean} analyze Analyze journeys/trees for custom nodes (expensive)
 * @returns {Promise<TreeSkeleton[]>} a promise that resolves to an array journey objects
 */
export async function listJourneys(
  long = false,
  analyze = false
): Promise<TreeSkeleton[]> {
  let journeys = [];
  try {
    journeys = await readJourneys();
    if (!long && !analyze) {
      for (const journeyStub of journeys) {
        printMessage(`${journeyStub['_id']}`, 'data');
      }
    } else {
      if (!analyze) {
        const table = createTable(['Name', 'Status', 'Tags']);
        for (const journeyStub of journeys) {
          table.push([
            `${journeyStub._id}`,
            journeyStub.enabled === false
              ? 'disabled'['brightRed']
              : 'enabled'['brightGreen'],
            journeyStub.uiConfig?.categories
              ? wordwrap(
                  JSON.parse(journeyStub.uiConfig.categories).join(', '),
                  60
                )
              : '',
          ]);
        }
        printMessage(table.toString(), 'data');
      } else {
        const spinnerId = createProgressIndicator(
          'indeterminate',
          0,
          `Retrieving details of all journeys...`
        );
        const exportPromises = [];
        try {
          for (const journeyStub of journeys) {
            exportPromises.push(
              exportJourney(journeyStub['_id'], {
                useStringArrays: false,
                deps: false,
                coords: true,
              })
            );
          }
          const journeyExports = await Promise.all(exportPromises);
          stopProgressIndicator(
            spinnerId,
            'Retrieved details of all journeys.',
            'success'
          );
          const table = createTable([
            'Name',
            'Status',
            'Classification',
            'Tags',
          ]);
          for (const journeyExport of journeyExports) {
            table.push([
              `${journeyExport.tree._id}`,
              journeyExport.tree.enabled === false
                ? 'disabled'['brightRed']
                : 'enabled'['brightGreen'],
              getJourneyClassification(journeyExport).join(', '),
              journeyExport.tree.uiConfig?.categories
                ? wordwrap(
                    JSON.parse(journeyExport.tree.uiConfig.categories).join(
                      ', '
                    ),
                    60
                  )
                : '',
            ]);
          }
          printMessage(table.toString(), 'data');
        } catch (error) {
          stopProgressIndicator(
            spinnerId,
            'Error retrieving details of all journeys.',
            'fail'
          );
          printMessage(error.response.data, 'error');
        }
      }
    }
  } catch (error) {
    printMessage(error.response?.data, 'error');
  }
  return journeys;
}

/**
 * Export journey by id/name to file
 * @param {string} journeyId journey id/name
 * @param {string} file optional export file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {TreeExportOptions} options export options
 */
export async function exportJourneyToFile(
  journeyId: string,
  file: string,
  includeMeta = true,
  options: TreeExportOptions = {
    deps: false,
    useStringArrays: false,
    coords: true,
  }
): Promise<void> {
  debugMessage(`exportJourneyToFile: start`);
  const verbose = state.getVerbose();
  if (!file) {
    file = getTypedFilename(journeyId, 'journey');
  }
  const filePath = getFilePath(file, true);
  let spinnerId: string;
  if (!verbose)
    spinnerId = createProgressIndicator('indeterminate', 0, `${journeyId}`);
  try {
    const fileData: SingleTreeExportInterface = await exportJourney(
      journeyId,
      options
    );
    if (verbose)
      spinnerId = createProgressIndicator('indeterminate', 0, `${journeyId}`);
    saveJsonToFile(fileData, filePath, includeMeta);
    stopProgressIndicator(
      spinnerId,
      `Exported ${journeyId['brightCyan']} to ${filePath['brightCyan']}.`,
      'success'
    );
  } catch (error) {
    if (verbose)
      spinnerId = createProgressIndicator('indeterminate', 0, `${journeyId}`);
    stopProgressIndicator(
      spinnerId,
      `Error exporting journey ${journeyId}: ${error}`,
      'fail'
    );
  }
}

/**
 * Export all journeys to file
 * @param {string} file optional export file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {TreeExportOptions} options export options
 */
export async function exportJourneysToFile(
  file: string,
  includeMeta = true,
  options: TreeExportOptions = {
    deps: false,
    useStringArrays: false,
    coords: true,
  }
): Promise<void> {
  if (!file) {
    file = getTypedFilename(`all${getRealmString()}Journeys`, 'journey');
  }
  const filePath = getFilePath(file, true);
  const fileData: MultiTreeExportInterface = await exportJourneys(options);
  saveJsonToFile(fileData, filePath, includeMeta);
}

/**
 * Export all journeys to separate files
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {TreeExportOptions} options export options
 */
export async function exportJourneysToFiles(
  includeMeta = true,
  options: TreeExportOptions = {
    deps: false,
    useStringArrays: false,
    coords: true,
  }
): Promise<void> {
  const journeysExport = await exportJourneys(options);
  const trees = Object.entries(journeysExport.trees);
  for (const [treeId, treeValue] of trees) {
    const indicatorId = createProgressIndicator(
      'determinate',
      1,
      `Saving ${treeId}...`
    );
    const file = getFilePath(getTypedFilename(`${treeId}`, 'journey'), true);
    treeValue['meta'] = journeysExport.meta;
    try {
      updateProgressIndicator(indicatorId, `Saving ${treeId} to ${file}`);
      saveJsonToFile(treeValue, file, includeMeta);
      stopProgressIndicator(indicatorId, `${treeId} saved to ${file}`);
    } catch (error) {
      stopProgressIndicator(indicatorId, `Error saving ${treeId} to ${file}`);
    }
  }
}

/**
 * Import a journey from file
 * @param {string} journeyId journey id/name
 * @param {string} file import file name
 * @param {TreeImportOptions} options import options
 */
export async function importJourneyFromFile(
  journeyId: string,
  file: string,
  options: TreeImportOptions
) {
  const verbose = state.getVerbose();
  try {
    const data = fs.readFileSync(getFilePath(file), 'utf8');
    let journeyData = JSON.parse(data);
    // check if this is a file with multiple trees and get journey by id
    if (journeyData.trees && journeyData.trees[journeyId]) {
      journeyData = journeyData.trees[journeyId];
    } else if (journeyData.trees) {
      journeyData = null;
    }

    // if a journeyId was specified, only import the matching journey
    if (journeyData && journeyId === journeyData.tree._id) {
      // attempt dependency resolution for single tree import
      const installedJourneys = (await readJourneys()).map((x) => x._id);
      const unresolvedJourneys = {};
      const resolvedJourneys = [];
      const indicatorId1 = createProgressIndicator(
        'indeterminate',
        0,
        'Resolving dependencies'
      );
      await resolveDependencies(
        installedJourneys,
        { [journeyId]: journeyData },
        unresolvedJourneys,
        resolvedJourneys
      );
      if (Object.keys(unresolvedJourneys).length === 0) {
        stopProgressIndicator(
          indicatorId1,
          `Resolved all dependencies.`,
          'success'
        );

        let indicatorId2: string;
        if (!verbose)
          indicatorId2 = createProgressIndicator(
            'indeterminate',
            0,
            `Importing ${journeyId}...`
          );
        try {
          await importJourney(journeyData, options);
          if (verbose)
            indicatorId2 = createProgressIndicator(
              'indeterminate',
              0,
              `Importing ${journeyId}...`
            );
          stopProgressIndicator(
            indicatorId2,
            `Imported ${journeyId}.`,
            'success'
          );
        } catch (importError) {
          if (verbose)
            indicatorId2 = createProgressIndicator(
              'indeterminate',
              0,
              `Importing ${journeyId}...`
            );
          stopProgressIndicator(indicatorId2, `${importError}`, 'fail');
        }
      } else {
        stopProgressIndicator(indicatorId1, `Unresolved dependencies:`, 'fail');
        for (const journey of Object.keys(unresolvedJourneys)) {
          printMessage(
            `  ${journey} requires ${unresolvedJourneys[journey]}`,
            'error'
          );
        }
      }
      // end dependency resolution for single tree import
    } else {
      const indicatorId3 = createProgressIndicator(
        'indeterminate',
        0,
        `Importing ${journeyId}...`
      );
      stopProgressIndicator(indicatorId3, `${journeyId} not found!`, 'fail');
    }
  } catch (error) {
    printMessage(`Error importing journey ${journeyId}: ${error}`, 'error');
  }
}

/**
 * Import first journey from file
 * @param {string} file import file name
 * @param {TreeImportOptions} options import options
 */
export async function importFirstJourneyFromFile(
  file: string,
  options: TreeImportOptions
) {
  const verbose = state.getVerbose();
  try {
    const data = fs.readFileSync(getFilePath(file), 'utf8');
    let journeyData = cloneDeep(JSON.parse(data));
    let journeyId = null;
    // single tree
    if (journeyData.tree) {
      journeyId = cloneDeep(journeyData.tree._id);
    }
    // multiple trees, so get the first tree
    else if (journeyData.trees) {
      for (const treeId in journeyData.trees) {
        if (Object.hasOwnProperty.call(journeyData.trees, treeId)) {
          journeyId = treeId;
          journeyData = journeyData.trees[treeId];
          break;
        }
      }
    }

    // if a journeyId was specified, only import the matching journey
    if (journeyData && journeyId) {
      // attempt dependency resolution for single tree import
      const installedJourneys = (await readJourneys()).map((x) => x._id);
      const unresolvedJourneys = {};
      const resolvedJourneys = [];
      const depSpinnerId = createProgressIndicator(
        'indeterminate',
        0,
        'Resolving dependencies'
      );
      await resolveDependencies(
        installedJourneys,
        { [journeyId]: journeyData },
        unresolvedJourneys,
        resolvedJourneys
      );
      if (Object.keys(unresolvedJourneys).length === 0) {
        stopProgressIndicator(
          depSpinnerId,
          `Resolved all dependencies.`,
          'success'
        );

        let importSpinnerId: string;
        if (!verbose)
          importSpinnerId = createProgressIndicator(
            'indeterminate',
            0,
            `Importing ${journeyId}...`
          );
        try {
          await importJourney(journeyData, options);
          if (verbose)
            importSpinnerId = createProgressIndicator(
              'indeterminate',
              0,
              `Importing ${journeyId}...`
            );
          stopProgressIndicator(
            importSpinnerId,
            `Imported ${journeyId}.`,
            'success'
          );
        } catch (importError) {
          if (verbose)
            importSpinnerId = createProgressIndicator(
              'indeterminate',
              0,
              `Importing ${journeyId}...`
            );
          stopProgressIndicator(importSpinnerId, `${importError}`, 'fail');
        }
      } else {
        stopProgressIndicator(depSpinnerId, `Unresolved dependencies:`, 'fail');
        for (const journey of Object.keys(unresolvedJourneys)) {
          printMessage(
            `  ${journey} requires ${unresolvedJourneys[journey]}`,
            'error'
          );
        }
      }
    } else {
      const importSpinnerId = createProgressIndicator(
        'indeterminate',
        0,
        `Importing...`
      );
      stopProgressIndicator(importSpinnerId, `No journeys found!`, 'fail');
    }
    // end dependency resolution for single tree import
  } catch (error) {
    printMessage(`Error importing first journey: ${error}`, 'error');
  }
}

/**
 * Import all journeys from file
 * @param {string} file import file name
 * @param {TreeImportOptions} options import options
 */
export async function importJourneysFromFile(
  file: string,
  options: TreeImportOptions
) {
  try {
    const data = fs.readFileSync(getFilePath(file), 'utf8');
    try {
      const fileData = JSON.parse(data);
      await importJourneys(fileData, options);
    } catch (error) {
      if (error.name === 'UnresolvedDependenciesError') {
        for (const journey of Object.keys(error.unresolvedJourneys)) {
          printMessage({
            message: `  - ${journey} requires ${error.unresolvedJourneys[journey]}`,
            type: 'info',
            state,
          });
        }
      } else {
        printMessage(`${error.message}`, 'error');
      }
    }
  } catch (error) {
    printMessage(`Error importing journeys: ${error}`, 'error');
  }
}

/**
 * Import all journeys from separate files
 * @param {TreeImportOptions} options import options
 */
export async function importJourneysFromFiles(options: TreeImportOptions) {
  const names = fs.readdirSync(getWorkingDirectory());
  const jsonFiles = names
    .filter((name) => name.toLowerCase().endsWith('.journey.json'))
    .map((name) => getFilePath(name));
  const allJourneysData = { trees: {} };
  for (const file of jsonFiles) {
    const journeyData = JSON.parse(fs.readFileSync(file, 'utf8'));
    allJourneysData.trees[journeyData.tree._id] = journeyData;
  }
  try {
    await importJourneys(allJourneysData as MultiTreeExportInterface, options);
  } catch (error) {
    printMessage(`${error.response?.data?.message || error.message}`, 'error');
  }
}

/**
 * Get journey classification
 * @param {SingleTreeExportInterface} journey journey export
 * @returns {string[]} Colored string array of classifications
 */
export function getJourneyClassification(
  journey: SingleTreeExportInterface
): JourneyClassificationType[] {
  return _getJourneyClassification(journey).map((it) => {
    switch (it) {
      case 'standard':
        return it['brightGreen'];

      case 'cloud':
        return it['brightMagenta'];

      case 'custom':
        return it['brightRed'];

      case 'premium':
        return it['brightYellow'];
    }
  });
}

/**
 * Get journey classification in markdown
 * @param {SingleTreeExportInterface} journey journey export
 * @returns {string[]} Colored string array of classifications
 */
export function getJourneyClassificationMd(
  journey: SingleTreeExportInterface
): string[] {
  return _getJourneyClassification(journey).map((it) => {
    switch (it) {
      case 'standard':
        return `:green_circle: \`${it}\``;

      case 'cloud':
        return `:purple_circle: \`${it}\``;

      case 'custom':
        return `:red_circle: \`${it}\``;

      case 'premium':
        return `:yellow_circle: \`${it}\``;
    }
  });
}

/**
 * Get a one-line description of the tree object
 * @param {TreeSkeleton} treeObj circle of trust object to describe
 * @returns {string} a one-line description
 */
export function getOneLineDescription(treeObj: TreeSkeleton): string {
  const description = `[${treeObj._id['brightCyan']}]`;
  return description;
}

/**
 * Get a one-line description of the tree object in markdown
 * @param {TreeSkeleton} treeObj circle of trust object to describe
 * @returns {string} a one-line description
 */
export function getOneLineDescriptionMd(treeObj: TreeSkeleton): string {
  const description = `${treeObj._id}`;
  return description;
}

/**
 * Helper function to render a nested list of dependent trees
 * @param {TreeDependencyMapInterface} descendents tree dependency map
 * @param {number} depth level of nesting
 */
function describeTreeDescendents(
  descendents: TreeDependencyMapInterface,
  depth = 0
) {
  if (depth || Object.values(descendents)[0].length) {
    // heading
    if (depth === 0) {
      printMessage(
        `\nInner Tree Dependencies (${Object.values(descendents)[0].length}):`,
        'data'
      );
    }
    const indent = Array(depth * 2)
      .fill(' ')
      .join('');
    const [tree] = Object.keys(descendents);
    printMessage(`${indent}- ${tree['brightCyan']}`, 'data');
    for (const descendent of descendents[tree]) {
      describeTreeDescendents(descendent, depth + 1);
    }
  }
}

/**
 * Helper function to render a nested list of dependent trees in markdown
 * @param {TreeDependencyMapInterface} descendents tree dependency map
 * @param {number} depth level of nesting
 */
function describeTreeDescendentsMd(
  descendents: TreeDependencyMapInterface,
  depth = 0
): string {
  let markdown = '';
  if (depth || Object.values(descendents)[0].length) {
    // heading
    if (depth === 0) {
      markdown += `## Inner Tree Dependencies (${
        Object.values(descendents)[0].length
      })\n`;
    }
    const indent = Array(depth * 2)
      .fill(' ')
      .join('');
    const [tree] = Object.keys(descendents);
    markdown += `${indent}- ${tree}\n`;
    for (const descendent of descendents[tree]) {
      markdown += describeTreeDescendentsMd(descendent, depth + 1);
    }
    return markdown;
  }
  return markdown;
}

/**
 * Describe a journey:
 * - Properties, tags, description, name, metadata
 * - Inner tree dependency tree
 * - Node type summary
 * - Nodes
 * - Themes
 * - Scripts
 * - Email templates
 * - Social identity providers
 * - SAML2 entity providers
 * - SAML2 circles of trust
 * @param {SingleTreeExportInterface} journeyData journey export object
 * @param {TreeExportResolverInterface} resolveTreeExport tree export resolver callback function
 */
export async function describeJourney(
  journeyData: SingleTreeExportInterface,
  resolveTreeExport: TreeExportResolverInterface = onlineTreeExportResolver
): Promise<void> {
  const allNodes = {
    ...journeyData.nodes,
    ...journeyData.innerNodes,
  };
  const nodeTypeMap = {};

  for (const nodeData of Object.values(allNodes)) {
    if (nodeTypeMap[nodeData._type._id]) {
      nodeTypeMap[nodeData._type._id] += 1;
    } else {
      nodeTypeMap[nodeData._type._id] = 1;
    }
  }

  // initialize AM version from file
  if (!state.getAmVersion() && journeyData.meta?.originAmVersion) {
    state.setAmVersion(journeyData.meta.originAmVersion);
  }

  // Journey Name
  printMessage(`${getOneLineDescription(journeyData.tree)}`, 'data');
  printMessage(Array(`[${journeyData.tree._id}]`['length']).fill('=').join(''));

  // Description
  if (journeyData.tree.description) {
    printMessage(`\n${journeyData.tree.description}`, 'data');
  }

  // Status
  printMessage(
    `\nStatus\n${
      journeyData.tree.enabled === false
        ? 'disabled'['brightRed']
        : 'enabled'['brightGreen']
    }`
  );

  // Classification
  if (state.getAmVersion()) {
    printMessage(
      `\nClassification\n${getJourneyClassification(journeyData).join(', ')}`,
      'data'
    );
  }

  // Categories/Tags
  if (
    journeyData.tree.uiConfig?.categories &&
    journeyData.tree.uiConfig.categories != '[]'
  ) {
    printMessage('\nCategories/Tags', 'data');
    printMessage(
      `${JSON.parse(journeyData.tree.uiConfig.categories).join(', ')}`,
      'data'
    );
  }

  // Dependency Tree
  try {
    const descendents = await getTreeDescendents(
      journeyData,
      resolveTreeExport
    );
    describeTreeDescendents(descendents);
  } catch (error) {
    printMessage(`Error resolving inner tree dependencies:`, 'error');
    printMessage(error.stack, 'error');
  }

  // Node Types
  if (Object.entries(nodeTypeMap).length) {
    printMessage(
      `\nNode Types (${Object.entries(nodeTypeMap).length}):`,
      'data'
    );
    for (const [nodeType, count] of Object.entries(nodeTypeMap)) {
      printMessage(
        `- ${String(count)} [${
          nodeType['brightCyan']
        }] (${Node.getNodeClassification(nodeType).join(', ')})`,
        'data'
      );
    }
  }

  // Nodes
  if (Object.entries(allNodes).length) {
    printMessage(`\nNodes (${Object.entries(allNodes).length}):`, 'data');
    for (const nodeObj of Object.values<NodeSkeleton>(allNodes)) {
      printMessage(
        `- ${Node.getOneLineDescription(
          nodeObj,
          getNodeRef(nodeObj, journeyData)
        )}`,
        'data'
      );
    }
  }

  // Themes
  if (journeyData.themes?.length) {
    printMessage(`\nThemes (${journeyData.themes.length}):`, 'data');
    for (const themeData of journeyData.themes) {
      printMessage(`- ${Theme.getOneLineDescription(themeData)}`, 'data');
    }
  }

  // Scripts
  if (Object.entries(journeyData.scripts).length) {
    printMessage(
      `\nScripts (${Object.entries(journeyData.scripts).length}):`,
      'data'
    );
    for (const scriptData of Object.values(journeyData.scripts)) {
      printMessage(`- ${Script.getOneLineDescription(scriptData)}`, 'data');
    }
  }

  // Email Templates
  if (Object.entries(journeyData.emailTemplates).length) {
    printMessage(
      `\nEmail Templates (${
        Object.entries(journeyData.emailTemplates).length
      }):`,
      'data'
    );
    for (const templateData of Object.values(journeyData.emailTemplates)) {
      printMessage(
        `- ${EmailTemplate.getOneLineDescription(templateData)}`,
        'data'
      );
    }
  }

  // Social Identity Providers
  if (Object.entries(journeyData.socialIdentityProviders).length) {
    printMessage(
      `\nSocial Identity Providers (${
        Object.entries(journeyData.socialIdentityProviders).length
      }):`,
      'data'
    );
    for (const socialIdpData of Object.values(
      journeyData.socialIdentityProviders
    )) {
      printMessage(`- ${Idp.getOneLineDescription(socialIdpData)}`, 'data');
    }
  }

  // SAML2 Entity Providers
  if (Object.entries(journeyData.saml2Entities).length) {
    printMessage(
      `\nSAML2 Entity Providers (${
        Object.entries(journeyData.saml2Entities).length
      }):`,
      'data'
    );
    for (const entityProviderData of Object.values(journeyData.saml2Entities)) {
      printMessage(
        `- ${Saml2.getOneLineDescription(entityProviderData)}`,
        'data'
      );
    }
  }

  // SAML2 Circles Of Trust
  if (Object.entries(journeyData.circlesOfTrust).length) {
    printMessage(
      `\nSAML2 Circles Of Trust (${
        Object.entries(journeyData.circlesOfTrust).length
      }):`,
      'data'
    );
    for (const cotData of Object.values(journeyData.circlesOfTrust)) {
      printMessage(
        `- ${CirclesOfTrust.getOneLineDescription(cotData)}`,
        'data'
      );
    }
  }
}

/**
 * Describe a journey in markdown:
 * - Properties, tags, description, name, metadata
 * - Inner tree dependency tree
 * - Node type summary
 * - Nodes
 * - Themes
 * - Scripts
 * - Email templates
 * - Social identity providers
 * - SAML2 entity providers
 * - SAML2 circles of trust
 * @param {SingleTreeExportInterface} journeyData journey export object
 * @param {TreeExportResolverInterface} resolveTreeExport tree export resolver callback function
 */
export async function describeJourneyMd(
  journeyData: SingleTreeExportInterface,
  resolveTreeExport: TreeExportResolverInterface = onlineTreeExportResolver
) {
  const allNodes = {
    ...journeyData.nodes,
    ...journeyData.innerNodes,
  };
  const nodeTypeMap = {};

  for (const nodeData of Object.values(allNodes)) {
    if (nodeTypeMap[nodeData._type._id]) {
      nodeTypeMap[nodeData._type._id] += 1;
    } else {
      nodeTypeMap[nodeData._type._id] = 1;
    }
  }

  // initialize AM version from file
  if (!state.getAmVersion() && journeyData.meta?.originAmVersion) {
    state.setAmVersion(journeyData.meta.originAmVersion);
  }

  // Journey Name
  printMessage(
    `# ${getOneLineDescriptionMd(journeyData.tree)} - ${
      journeyData.tree.enabled === false
        ? ':o: `disabled`'
        : ':white_check_mark: `enabled`'
    }, ${getJourneyClassificationMd(journeyData).join(', ')}`,
    'data'
  );

  // Categories/Tags
  if (
    journeyData.tree.uiConfig?.categories &&
    journeyData.tree.uiConfig.categories != '[]'
  ) {
    printMessage(
      `\`${JSON.parse(journeyData.tree.uiConfig.categories).join('`, `')}\``,
      'data'
    );
  }

  // Description
  if (journeyData.tree.description) {
    printMessage(`\n${journeyData.tree.description}`, 'data');
  }

  // Journey image
  printMessage(`\n[![](./${journeyData.tree._id}.png)]()\n`, 'data');

  // Dependency Tree
  const descendents = await getTreeDescendents(journeyData, resolveTreeExport);
  printMessage(describeTreeDescendentsMd(descendents), 'data');

  // Node Types
  if (Object.entries(nodeTypeMap).length) {
    printMessage(
      `## Node Types (${Object.entries(nodeTypeMap).length})`,
      'data'
    );
    printMessage('| Count | Type | Classification |', 'data');
    printMessage('| -----:| ---- | -------------- |', 'data');
    for (const [nodeType, count] of Object.entries(nodeTypeMap)) {
      printMessage(
        `| ${String(count)} | ${nodeType} | ${Node.getNodeClassificationMd(
          nodeType
        ).join('<br>')} |`,
        'data'
      );
    }
  }

  // Nodes
  if (Object.entries(allNodes).length) {
    printMessage(`## Nodes (${Object.entries(allNodes).length})`, 'data');
    printMessage(Node.getTableHeaderMd(), 'data');
    for (const nodeObj of Object.values<NodeSkeleton>(allNodes)) {
      printMessage(
        `${Node.getTableRowMd(nodeObj, getNodeRef(nodeObj, journeyData))}`,
        'data'
      );
    }
  }

  // Themes
  if (journeyData.themes?.length) {
    printMessage(`## Themes (${journeyData.themes.length})`, 'data');
    printMessage(Theme.getTableHeaderMd(), 'data');
    for (const themeData of journeyData.themes) {
      printMessage(`${Theme.getTableRowMd(themeData)}`, 'data');
    }
  }

  // Scripts
  if (Object.entries(journeyData.scripts).length) {
    printMessage(
      `## Scripts (${Object.entries(journeyData.scripts).length})`,
      'data'
    );
    printMessage(Script.getTableHeaderMd(), 'data');
    for (const scriptData of Object.values(journeyData.scripts)) {
      printMessage(`${Script.getTableRowMd(scriptData)}`, 'data');
    }
  }

  // Email Templates
  if (Object.entries(journeyData.emailTemplates).length) {
    printMessage(
      `## Email Templates (${
        Object.entries(journeyData.emailTemplates).length
      })`,
      'data'
    );
    printMessage(EmailTemplate.getTableHeaderMd(), 'data');
    for (const templateData of Object.values(journeyData.emailTemplates)) {
      printMessage(`${EmailTemplate.getTableRowMd(templateData)}`, 'data');
    }
  }

  // Social Identity Providers
  if (Object.entries(journeyData.socialIdentityProviders).length) {
    printMessage(
      `## Social Identity Providers (${
        Object.entries(journeyData.socialIdentityProviders).length
      })`,
      'data'
    );
    printMessage(Idp.getTableHeaderMd(), 'data');
    for (const socialIdpData of Object.values(
      journeyData.socialIdentityProviders
    )) {
      printMessage(`${Idp.getTableRowMd(socialIdpData)}`, 'data');
    }
  }

  // SAML2 Entity Providers
  if (Object.entries(journeyData.saml2Entities).length) {
    printMessage(
      `## SAML2 Entity Providers (${
        Object.entries(journeyData.saml2Entities).length
      })`,
      'data'
    );
    printMessage(Saml2.getTableHeaderMd(), 'data');
    for (const entityProviderData of Object.values(journeyData.saml2Entities)) {
      printMessage(`${Saml2.getTableRowMd(entityProviderData)}`, 'data');
    }
  }

  // SAML2 Circles Of Trust
  if (Object.entries(journeyData.circlesOfTrust).length) {
    printMessage(
      `## SAML2 Circles Of Trust (${
        Object.entries(journeyData.circlesOfTrust).length
      })`,
      'data'
    );
    printMessage(CirclesOfTrust.getTableHeaderMd(), 'data');
    for (const cotData of Object.values(journeyData.circlesOfTrust)) {
      printMessage(`${CirclesOfTrust.getTableRowMd(cotData)}`, 'data');
    }
  }
}

export async function enableJourney(journeyId: string): Promise<boolean> {
  const indicatorId = createProgressIndicator(
    'indeterminate',
    0,
    `Enabling journey ${journeyId}...`
  );
  if (_enableJourney(journeyId)) {
    stopProgressIndicator(
      indicatorId,
      `Enabled journey ${journeyId}.`,
      'success'
    );
    return true;
  } else {
    stopProgressIndicator(
      indicatorId,
      `Error enabling journey ${journeyId}`,
      'fail'
    );
    return false;
  }
}

export async function disableJourney(journeyId: string): Promise<boolean> {
  const indicatorId = createProgressIndicator(
    'indeterminate',
    0,
    `Disabling journey ${journeyId}...`
  );
  if (_disableJourney(journeyId)) {
    stopProgressIndicator(
      indicatorId,
      `Disabled journey ${journeyId}.`,
      'success'
    );
    return true;
  } else {
    stopProgressIndicator(
      indicatorId,
      `Error disabling journey ${journeyId}`,
      'fail'
    );
    return false;
  }
}
