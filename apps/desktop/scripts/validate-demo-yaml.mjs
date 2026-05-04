// One-off validator: confirms src-tauri/resources/example-amex-gold.yaml
// parses cleanly under @lifeops/schema's PersonalContext. Run via
// `pnpm --filter @lifeops/desktop run validate:demo` — wired into the
// `test` script so CI fails the build if the demo drifts from schema.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse } from 'yaml';
import { PersonalContext } from '@lifeops/schema';

const here = dirname(fileURLToPath(import.meta.url));
const yamlPath = join(here, '..', 'src-tauri', 'resources', 'example-amex-gold.yaml');

const raw = await readFile(yamlPath, 'utf8');
const parsed = parse(raw);
const result = PersonalContext.safeParse(parsed);

if (!result.success) {
  console.error(`✖ ${yamlPath}`);
  console.error(JSON.stringify(result.error.format(), null, 2));
  process.exit(1);
}

const ctx = result.data;
console.log(`✓ ${yamlPath}`);
console.log(`  schema_version=${ctx._meta.schema_version}`);
console.log(`  cards=${ctx.cards.length}  loyalty=${ctx.loyalty.length}  service_credits=${ctx.service_credits.length}`);
console.log(`  benefit_definitions=${ctx.benefit_definitions.length}  credit_instances=${ctx.credit_instances.length}`);
