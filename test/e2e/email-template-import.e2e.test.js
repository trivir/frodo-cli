import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

const allDirectory = 'test/e2e/exports/all';
const allAlphaEmailTemplatesFileName = 'allEmailTemplates.template.email.json';
const allAlphaEmailTemplatesExport = `${allDirectory}/${allAlphaEmailTemplatesFileName}`;
const allSeparateEmailTemplatesDirectory = `test/e2e/exports/all-separate/cloud/global/emailTemplate`;
const allSeparateEmailTemplatesRawDirectory = `test/e2e/exports/all-separate/raw`;
const emailTemplateWelcomeRawFileName = 'emailTemplate-welcome.json';
const emailTemplateWelcomeRawExport = `${allSeparateEmailTemplatesRawDirectory}/${emailTemplateWelcomeRawFileName}`;

describe('frodo email template import', () => {
  test(`"frodo email template import --raw -i welcome -f ${emailTemplateWelcomeRawFileName} -D ${allSeparateEmailTemplatesRawDirectory}": should import the email template with the id "welcome" from the file "${emailTemplateWelcomeRawExport}"`, async () => {
    const CMD = `frodo email template import --raw -i welcome -f ${emailTemplateWelcomeRawFileName} -D ${allSeparateEmailTemplatesRawDirectory}`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo email template import --template-id welcome --file ${allAlphaEmailTemplatesExport}": should import the email template with the id "welcome" from the file "${allAlphaEmailTemplatesExport}"`, async () => {
    const CMD = `frodo email template import --template-id welcome --file ${allAlphaEmailTemplatesExport}`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo email template import --raw -f ${emailTemplateWelcomeRawFileName} -D ${allSeparateEmailTemplatesRawDirectory}": should import the first email template from the file "${emailTemplateWelcomeRawExport}"`, async () => {
    const CMD = `frodo email template import --raw -f ${emailTemplateWelcomeRawFileName} -D ${allSeparateEmailTemplatesRawDirectory}`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo email template import --file ${allAlphaEmailTemplatesExport}": should import the first email template from the file "${allAlphaEmailTemplatesExport}"`, async () => {
    const CMD = `frodo email template import --file ${allAlphaEmailTemplatesExport}`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo email template import -af ${allAlphaEmailTemplatesExport}": should import all email templates from the file "${allAlphaEmailTemplatesExport}"`, async () => {
    const CMD = `frodo email template import -af ${allAlphaEmailTemplatesExport}`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo email template import --all --file ${allAlphaEmailTemplatesExport}": should import all email templates from the file "${allAlphaEmailTemplatesExport}"`, async () => {
    const CMD = `frodo email template import --all --file ${allAlphaEmailTemplatesExport}`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo email template import -af ${allAlphaEmailTemplatesFileName} -D ${allDirectory}": should import all email templates from the file "${allAlphaEmailTemplatesExport}"`, async () => {
    const CMD = `frodo email template import -af ${allAlphaEmailTemplatesFileName} -D ${allDirectory}`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo email template import --raw -AD ${allSeparateEmailTemplatesRawDirectory}": should import all email templates from the ${allSeparateEmailTemplatesRawDirectory} directory"`, async () => {
    const CMD = `frodo email template import --raw -AD ${allSeparateEmailTemplatesRawDirectory}`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo email template import --all-separate --directory ${allSeparateEmailTemplatesDirectory}": should import all email templates from the ${allSeparateEmailTemplatesDirectory} directory"`, async () => {
    const CMD = `frodo email template import --all-separate --directory ${allSeparateEmailTemplatesDirectory}`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });
});
