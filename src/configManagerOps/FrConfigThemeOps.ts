import { frodo, state } from '@rockcarver/frodo-lib';
import {
  printError
} from '../utils/Console';
const { getRealms, readThemes } = require('@rockcarver/frodo-lib');

const {
  saveToFile,
  getFilePath
} = frodo.utils;
const {
  exportThemes
} = frodo.theme;

export async function exportFrConfigThemesToFiles(): Promise<boolean> {
  try {
    const realms = await getRealms({ state });
    for (const realm of realms.result) {
      const themes = await readThemes({ realm: realm.name, state });
      for (const theme of themes) {
        const exportDir = getFilePath(`${realm.name}/themes/${theme.name}/${theme._id}.json`, true);
        saveToFile('theme', theme, '_id', exportDir);
      }
    }
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}