import { ScriptExportInterface } from '@rockcarver/frodo-lib/types/ops/ScriptOps';
import { Option } from 'commander';

import { scriptDiffer, scriptExporter } from '../../ops/ScriptOps';
import { DepsOption } from '../../utils/Diff';
import { DiffCommand } from '../FrodoCommand';

export default function setup() {
  const program = new DiffCommand<ScriptExportInterface, DepsOption>(
    'frodo script diff',
    'Diff scripts',
    true,
    scriptExporter,
    scriptDiffer
  );
  program.addOption(
    new Option(
      '--no-deps',
      'Do not include script dependencies (i.e. library scripts).'
    )
  );
  return program;
}
