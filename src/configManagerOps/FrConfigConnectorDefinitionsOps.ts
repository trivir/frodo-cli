import { frodo } from '@rockcarver/frodo-lib';
import { ConnectorSkeleton } from '@rockcarver/frodo-lib/types/ops/ConnectorOps';

import { printError, verboseMessage } from '../utils/Console';

const { connector } = frodo.idm;
const { getFilePath, saveJsonToFile } = frodo.utils;
type ByName = { connectorName: string };
type BySkeleton = { c: ConnectorSkeleton };

/**
 * Export connector definition using the name of the connector
 * @param criteria
 */
<<<<<<< HEAD
export async function configManagerExportConnectorDefinition(
=======
export async function exportConnectorDefinition(
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
  criteria: ByName
): Promise<boolean>;
/**
 * Export connector definition using the provided connector skeleton object
 * @param criteria
 */
<<<<<<< HEAD
export async function configManagerExportConnectorDefinition(
=======
export async function exportConnectorDefinition(
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
  criteria: BySkeleton
): Promise<boolean>;
/**
 * Export connector definition in fr-config manager format
 * @param criteria
 * @returns
 */
<<<<<<< HEAD
export async function configManagerExportConnectorDefinition(
=======
export async function exportConnectorDefinition(
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
  criteria: ByName | BySkeleton
): Promise<boolean> {
  try {
    const c: ConnectorSkeleton =
      'c' in criteria
        ? criteria.c
        : await connector.readConnector(criteria.connectorName);
    verboseMessage(`  Exporting connector: "${c._id}"`);
    saveJsonToFile(
      c,
      getFilePath(
        `sync/connectors/${c._id.substring(c._id.indexOf('/'))}.json`,
        true
      ),
      false,
      false
    );
    return true;
  } catch (error) {
    printError(
      error,
      'connectorName' in criteria
        ? `Does the connector: "${criteria.connectorName}" actually exist in the specified host?`
        : ''
    );
    return false;
  }
}

/**
 * Export all the connector definitions in the tenant each in their own file in fr-config manager format
 * @returns
 */
<<<<<<< HEAD
export async function configManagerExportConnectorDefinitionsAll(): Promise<boolean> {
=======
export async function exportAllConnectorDefinitions(): Promise<boolean> {
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
  try {
    const cs: ConnectorSkeleton[] = await connector.readConnectors();
    for (const c of cs) {
      if (c._id.includes('provisioner.openicf/')) {
<<<<<<< HEAD
        configManagerExportConnectorDefinition({ c: c });
=======
        exportConnectorDefinition({ c: c });
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
      }
    }
    return true;
  } catch (error) {
    printError(error);
  }
}
