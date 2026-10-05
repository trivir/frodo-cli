import { frodo, state } from '@rockcarver/frodo-lib';
import { ThemeSkeleton } from '@rockcarver/frodo-lib/types/ops/ThemeOps';
import fs from 'fs';

import { printError, printMessage } from '../utils/Console';
import { decodeOrNot, realmList } from '../utils/FrConfig';

const { saveJsonToFile, getFilePath } = frodo.utils;
const { readRealms } = frodo.realm;
const { readThemes, importThemes, deleteTheme } = frodo.theme;
const { DEFAULT_REALM_KEY } = frodo.utils.constants;

const THEME_HTML_FIELDS = [
  { name: 'accountFooter', encoded: false },
  { name: 'journeyFooter', encoded: false },
  { name: 'journeyHeader', encoded: false },
  { name: 'journeyJustifiedContent', encoded: false },
  { name: 'journeyFooterScriptTag', encoded: true },
  { name: 'accountFooterScriptTag', encoded: true },
];

function extractHtmlFields(theme: ThemeSkeleton, themePath: string): void {
  for (const field of THEME_HTML_FIELDS) {
    if (!theme[field.name]) continue;

    switch (typeof theme[field.name]) {
      case 'string': {
        const fileName = `${field.name}.html`;
        const filePath = `${themePath}/${fileName}`;
        fs.writeFileSync(
          filePath,
          decodeOrNot(theme[field.name] as string, field.encoded)
        );
        theme[field.name] = { file: fileName };
        break;
      }

      case 'object': {
        const fieldDir = `${themePath}/${field.name}`;
        fs.mkdirSync(fieldDir, { recursive: true });

        for (const locale of Object.keys(theme[field.name])) {
          const localeFilename = `${locale}.html`;
          const filePath = `${fieldDir}/${localeFilename}`;
          fs.writeFileSync(
            filePath,
            decodeOrNot(theme[field.name][locale], field.encoded)
          );
          theme[field.name][locale] = {
            file: `${field.name}/${localeFilename}`,
          };
        }
        break;
      }

      default:
        printMessage(
          `Unexpected type for ${field.name} in ${theme.name}`,
          'error'
        );
        process.exit(1);
    }
  }
}

export async function configManagerExportThemes(): Promise<boolean> {
  try {
    const realms = await readRealms();
    for (const realm of realms) {
      // fr-config-manager doesn't support root themes
      if (realm.name === '/') continue;
      state.setRealm(realm.name);
      const themes = await readThemes();
      const exportDir = getFilePath(`realms/${realm.name}/themes`, true);
      fs.mkdirSync(exportDir, { recursive: true });
      for (const theme of themes) {
        const themeDir = `${exportDir}/${theme.name}`;
        fs.mkdirSync(themeDir, { recursive: true });
        extractHtmlFields(theme, themeDir);
        saveJsonToFile(theme, `${themeDir}/${theme.name}.json`, false);
      }
    }
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

export async function configManagerImportThemes(): Promise<boolean> {
  try {
    const realms = await readRealms();
    for (const realm of realms) {
      // fr-config-manager doesn't support root themes
      if (realm.name === '/') continue;
      state.setRealm(realm.name);
      const importDir = getFilePath(
        `realms${realm.parentPath + realm.name}/themes`
      );
      const themesDir = fs
        .readdirSync(importDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);
      const themeMap: Record<string, ThemeSkeleton> = {};
      for (const themeName of themesDir) {
        const themeDir = `${importDir}/${themeName}`;
        const themeJsonPath = `${themeDir}/${themeName}.json`;
        const theme: ThemeSkeleton = JSON.parse(
          fs.readFileSync(themeJsonPath, 'utf8')
        );
        for (const field of THEME_HTML_FIELDS) {
          if (
            !theme[field.name] ||
            typeof theme[field.name] !== 'object' ||
            typeof (theme[field.name] as any).file !== 'string'
          )
            continue;
          const fileName = (theme[field.name] as any).file;
          const filePath = `${themeDir}/${fileName}`;
          const fileContent = fs.readFileSync(filePath, 'utf8');
          theme[field.name] = fileContent;
        }
        themeMap[theme._id] = theme;
      }
      await importThemes({ theme: themeMap });
    }
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

/**
 * Delete themes in the specified realm, or all listed realms if omitted.
 * Optionally filters themes by exact name.
 * Continues processing remaining themes and realms if a deletion fails.
 * @param name Optional name of the theme to delete.
 * @param realm Optional realm to process.
 * @returns False if a named theme is missing in a processed realm
 * or an error occurs; otherwise true.
 */
export async function configManagerDeleteThemes(
  name?: string,
  realm?: string
): Promise<boolean> {
  let success = true;
  try {
    const hasExplicitRealm = !!realm && realm !== DEFAULT_REALM_KEY;
    const realms = hasExplicitRealm ? [realm] : await realmList();
    if (realms.length === 0) {
      printMessage('No realms found.', 'warn');
      return false;
    }
    for (const currentRealm of realms) {
      if (!hasExplicitRealm && currentRealm === '/') continue;
      try {
        state.setRealm(currentRealm);

        const themes = await readThemes();
        const selectedThemes = name
          ? themes.filter((theme) => theme.name === name)
          : themes;
        if (selectedThemes.length === 0) {
          if (name) {
            printMessage(
              `Theme '${name}' not found in realm '${currentRealm}'.`,
              'warn'
            );
            success = false;
          } else {
            printMessage(
              `No themes found to delete in realm '${currentRealm}'.`
            );
          }
          continue;
        }
        for (const theme of selectedThemes) {
          try {
            await deleteTheme(theme._id);
            printMessage(
              `Deleted theme: ${theme.name} in realm '${currentRealm}'`
            );
          } catch (error) {
            printError(error);
            success = false;
          }
        }
      } catch (error) {
        printError(error);
        success = false;
      }
    }
    return success;
  } catch (error) {
    printError(error);
    return false;
  }
}
