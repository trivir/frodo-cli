import { frodo, state } from '@rockcarver/frodo-lib';
import { printError } from '../utils/Console';
import fs from 'fs';

const { saveJsonToFile, getFilePath } = frodo.utils;
const { readRealms } = frodo.realm;
const { readThemes } = frodo.theme;

const THEME_HTML_FIELDS = [
  { name: 'accountFooter', encoded: false },
  { name: 'journeyFooter', encoded: false },
  { name: 'journeyHeader', encoded: false },
  { name: 'journeyJustifiedContent', encoded: false },
  { name: 'journeyFooterScriptTag', encoded: true },
  { name: 'accountFooterScriptTag', encoded: true },
];

function decodeOrNot(value: string, encoded: boolean): string {
  return encoded ? Buffer.from(value, 'base64').toString('utf8') : value;
}

function extractHtmlFields(theme: any, themePath: string): void {
  for (const field of THEME_HTML_FIELDS) {
    if (!theme[field.name]) continue;

    switch (typeof theme[field.name]) {
      case 'string': {
        const fileName = `${field.name}.html`;
        const filePath = `${themePath}/${fileName}`;
        fs.writeFileSync(
          filePath,
          decodeOrNot(theme[field.name], field.encoded)
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
        console.error(`Unexpected type for ${field.name} in ${theme.name}`);
        process.exit(1);
    }
  }
}

export async function configManagerExportThemes(): Promise<boolean> {
  try {
    const realms = await readRealms();
    for (const realm of realms) {
      state.setRealm(realm.name);
      const realmDir = getFilePath(`realms/${realm.name}/themes`, true);
      fs.mkdirSync(realmDir, { recursive: true });

      const themes = await readThemes();
      const exportDir = getFilePath(`realms/${state.getRealm()}/themes`, true);
      for (const theme of themes) {
        const themeDir = `${exportDir}/${theme.name}`;
        fs.mkdirSync(themeDir, { recursive: true });
        extractHtmlFields(theme, themeDir);
        const themeFile = `${themeDir}/${theme.name}.json`;
        saveJsonToFile(theme, themeFile, false);
      }
    }
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}
