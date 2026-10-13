import { FrodoStubCommand } from '../../FrodoCommand';
import CheckPromotionStatus from './config-manager-promote-check-promotion-status';

export default function setup() {
  const program = new FrodoStubCommand('promote').description(
    'Promote configuration optimized for CI/CD pipelines (format compatible with fr-config-manager).'
  );
  program.addCommand(CheckPromotionStatus().name('check-promotion-status'));

  return program;
}
