import { FrodoStubCommand } from '../FrodoCommand';
import DeleteCmd from './idm-mapping-delete';
import ExportCmd from './idm-mapping-export';
import ImportCmd from './idm-mapping-import';
import ListCmd from './idm-mapping-list.js';
import RenameCmd from './idm-mapping-rename.js';

export default function setup() {
  const program = new FrodoStubCommand('frodo idm mapping');

  program.description('Manage mappings.');

  program.addCommand(DeleteCmd().name('delete'));

  program.addCommand(ExportCmd().name('export'));

  program.addCommand(ImportCmd().name('import'));

  program.addCommand(ListCmd().name('list'));

  program.addCommand(RenameCmd().name('rename'));

  return program;
}
