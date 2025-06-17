import { frodo } from '@rockcarver/frodo-lib';

<<<<<<< HEAD
import { printError, printMessage } from '../utils/Console';
=======
import { printError } from '../utils/Console';
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd

const { getFilePath, saveJsonToFile } = frodo.utils;
const { readInternalRoles } = frodo.role;
/**
 * Export an internal roles in fr-config-manager format.
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
<<<<<<< HEAD
export async function configManagerExportInternalRoles(
=======
export async function configManagerExportRoles(
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
  name?: string
): Promise<boolean> {
  try {
    const exportData = await readInternalRoles();
    for (const role of Object.values(exportData)) {
<<<<<<< HEAD
      printMessage(`name = ${name} &&& role.name = ${role.name}`);

      if (name && name !== role.name) {
        printMessage('return');
=======
      if (name && name !== role.name) {
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
        continue;
      }
      if (role.privileges && role.privileges.length > 0) {
        const fileName = `internal-roles/${role.name}.json`;
        saveJsonToFile(role, getFilePath(fileName, true), false, false);
      }
    }
    return true;
  } catch (error) {
    printError(error, `Error exporting internal roles to files`);
  }
  return false;
}
