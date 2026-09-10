import { frodo } from '@rockcarver/frodo-lib';
import { DirectConfigurationSessionState } from '@rockcarver/frodo-lib/types/api/cloud/EnvDirectConfigurationSessionApi';

import { printError, printMessage } from '../utils/Console';

const {
  readDirectConfigurationSessionState,
  initDirectConfigurationSession,
  applyDirectConfigurationSession,
  abortDirectConfigurationSession,
} = frodo.cloud.env;

/**
 * Read the current direct configuration session state.
 * @returns {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerReadDirectConfigurationSessionState(): Promise<boolean> {
  try {
    const response: DirectConfigurationSessionState =
      await readDirectConfigurationSessionState();

    printMessage(response, 'data');
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

/**
 * Initialize a new direct configuration session.
 * @returns {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerInitDirectConfigurationSession(): Promise<boolean> {
  try {
    const response: DirectConfigurationSessionState =
      await initDirectConfigurationSession();

    printMessage(response, 'data');
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

/**
 * Apply the current direct configuration session.
 * @returns {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerApplyDirectConfigurationSession(): Promise<boolean> {
  try {
    const response: DirectConfigurationSessionState =
      await applyDirectConfigurationSession();

    printMessage(response, 'data');
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

/**
 * Abort the current direct configuration session.
 * @returns {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerAbortDirectConfigurationSession(): Promise<boolean> {
  try {
    const response: DirectConfigurationSessionState =
      await abortDirectConfigurationSession();

    printMessage(response, 'data');
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}
