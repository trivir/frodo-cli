import { state } from '@rockcarver/frodo-lib';

import { printMessage } from '../../utils/Console';

/**
 * Deep clone object
 * @param {any} obj object to deep clone
 * @returns {any} new object cloned from obj
 */
export function cloneDeep(obj: any): any {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Asserts that the deployment type is one of those listed, otherwise prints an error message.
 * @param {string[]} types the variable number of types
 * @return {boolean} true if the deployment type is one of those listed, false otherwise
 */
export function assertDeploymentType(...types: string[]): boolean {
  if (!types.includes(state.getDeploymentType())) {
    printMessage(
      `'${state.getDeploymentType()}' deployment type not supported. Only the following deployment types are supported: ${types.join(
        ', '
      )}`,
      'error'
    );
    return false;
  }
  return true;
}
