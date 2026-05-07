import { getEnv, testExport } from './utils/TestUtils';
import { connection as c, classic_connection as cc } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
  './test/e2e/env/Connections.json';
const env = getEnv(c);
const classicEnv = getEnv(cc);

const type = 'config';

describe.skip('frodo config export', () => {
  test('"frodo config export -adND exportAllTestDir4": should export everything, including default scripts, to a single file', async () => {
    const exportFile = 'all.config.json';
    const exportDirectory = 'exportAllTestDir4';
    const CMD = `frodo config export -adND ${exportDirectory}`;
    await testExport(CMD, env, type, exportFile, exportDirectory, false);
  });

  test('"frodo config export --all --modified-properties --file testExportAll.json --use-string-arrays --no-decode --no-coords": should export everything to a single file named testExportAll.json with no decoding variables, no journey coordinates, and using string arrays', async () => {
    const exportFile = 'testExportAll.json';
    const CMD = `frodo config export --all --modified-properties --file ${exportFile} --use-string-arrays --no-decode --no-coords`;
    await testExport(CMD, env, type, exportFile);
  });

  test('"frodo config export -AD exportAllTestDir1": should export everything into separate files in the directory exportAllTestDir1', async () => {
    const exportDirectory = 'exportAllTestDir1';
    const CMD = `frodo config export -AD ${exportDirectory}`;
    await testExport(CMD, env, undefined, undefined, exportDirectory, false);
  });

  test('"frodo config export -MAsxD exportAllTestDir2": should export everything into separate files in the directory exportAllTestDir2 with scripts and mappings separate', async () => {
    const exportDirectory = 'exportAllTestDir2';
    const CMD = `frodo config export -MAsxD ${exportDirectory}`;
    await testExport(CMD, env, undefined, undefined, exportDirectory, false);
  });

  test('"frodo config export --all-separate --read-only --no-metadata --default --directory exportAllTestDir3 --use-string-arrays --no-decode --no-coords --no-extract --separate-mappings": should export everything, including default scripts, into separate files in the directory exportAllTestDir3 with scripts, no decoding variables, no journey coordinates, separate mappings, and using string arrays', async () => {
    const exportDirectory = 'exportAllTestDir3';
    const CMD = `frodo config export --all-separate --read-only --no-metadata --default --directory ${exportDirectory} --use-string-arrays --no-decode --no-coords --no-extract --separate-mappings`;
    await testExport(CMD, env, undefined, undefined, exportDirectory, false);
  });

  test('"frodo config export -RAD exportAllTestDir5 --include-active-values": should export everything including secret values into separate files in the directory exportAllTestDir5', async () => {
    const exportDirectory = 'exportAllTestDir5';
    const CMD = `frodo config export -RAD ${exportDirectory} --include-active-values`;
    await testExport(CMD, env, undefined, undefined, exportDirectory, false);
  });

  test('"frodo config export -raf testExportAllAlpha.json": should export all alpha realm config to a single file named testExportAllAlpha.json.', async () => {
    const exportFile = 'testExportAllAlpha.json';
    const CMD = `frodo config export -raf ${exportFile}`;
    await testExport(CMD, env, type, exportFile);
  });

  test('"frodo config export -gAD exportAllTestDir9": should export all global config into separate files in the directory exportAllTestDir9', async () => {
    const exportDirectory = 'exportAllTestDir9';
    const CMD = `frodo config export -gAD ${exportDirectory}`;
    await testExport(CMD, env, undefined, undefined, exportDirectory, false);
  });

  // Classic Env Tests

  test('"frodo config export -adND exportAllTestDir6 -m classic": should export everything, including default scripts, to a single file', async () => {
    const exportFile = 'all.config.json';
    const exportDirectory = 'exportAllTestDir6';
    const CMD = `frodo config export -adND ${exportDirectory} -m classic`;
    await testExport(CMD, classicEnv, type, exportFile, exportDirectory, false);
  });

  test('"frodo config export --all --modified-properties --read-only --file testExportAll2.json --include-active-values --use-string-arrays --no-decode --no-coords --type classic": should export everything to a single file named testExportAll2.json with no decoding variables, no journey coordinates, and using string arrays', async () => {
    const exportFile = 'testExportAll2.json';
    const CMD = `frodo config export --all --modified-properties --read-only --file ${exportFile} --include-active-values --use-string-arrays --no-decode --no-coords --type classic`;
    await testExport(CMD, classicEnv, type, exportFile);
  });

  test('"frodo config export -RMAsxD exportAllTestDir7 -m classic": should export everything into separate files in the directory exportAllTestDir7 with scripts and mappings separate', async () => {
    const exportDirectory = 'exportAllTestDir7';
    const CMD = `frodo config export -RMAsxD ${exportDirectory} -m classic`;
    await testExport(
      CMD,
      classicEnv,
      undefined,
      undefined,
      exportDirectory,
      false
    );
  });

  test('"frodo config export --all-separate --no-metadata --default --directory exportAllTestDir8 --include-active-values --use-string-arrays --no-decode --no-coords --type classic": should export everything, including default scripts, into separate files in the directory exportAllTestDir8 with scripts, no decoding variables, no journey coordinates, separate mappings, and using string arrays', async () => {
    const exportDirectory = 'exportAllTestDir8';
    const CMD = `frodo config export --all-separate --no-metadata --default --directory ${exportDirectory} --include-active-values --use-string-arrays --no-decode --no-coords --type classic`;
    await testExport(
      CMD,
      classicEnv,
      undefined,
      undefined,
      exportDirectory,
      false
    );
  });

  test('"frodo config export --realm-only -AD exportAllTestDir10 -m classic": should export all global config into separate files in the directory exportAllTestDir10', async () => {
    const exportDirectory = 'exportAllTestDir10';
    const CMD = `frodo config export --realm-only -AD ${exportDirectory} -m classic`;
    await testExport(CMD, env, undefined, undefined, exportDirectory, false);
  });

  test('"frodo config export --global-only -af testExportAllGlobal.json -m classic": should export all global config to a single file named testExportAllGlobal.json.', async () => {
    const exportFile = 'testExportAllGlobal.json';
    const CMD = `frodo config export --global-only -af ${exportFile} -m classic`;
    await testExport(CMD, env, type, exportFile);
  });
});
