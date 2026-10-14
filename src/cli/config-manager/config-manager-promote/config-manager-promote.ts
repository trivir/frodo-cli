import { FrodoStubCommand } from '../../FrodoCommand';
import CheckPromotionStatus from './config-manager-promote-check-promotion-status';
import RunDryrunPromotion from './config-manager-promote-run-dryrun-promotion';
import RunPromotion from './config-manager-promote-run-promotion';

export default function setup() {
  const program = new FrodoStubCommand('promote').description(
    'Promote configuration optimized for CI/CD pipelines (format compatible with fr-config-manager).'
  );
  program.addCommand(CheckPromotionStatus().name('check-promotion-status'));
  program.addCommand(RunDryrunPromotion().name('run-dryrun-promotion'));
  program.addCommand(RunPromotion().name('run-promotion'));
  return program;
}
