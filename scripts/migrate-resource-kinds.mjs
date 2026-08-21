import fs from 'node:fs';
import path from 'node:path';

// One-time migration for existing GitHub cards; remove after validation.
const DATE = '2026-08-21';
const ROOT = path.join(process.cwd(), 'content/knowledge/2026');

const classifications = new Map([
  ['github-ai21002102-riverbend.md', 'project'],
  ['github-akitaonrails-ai-memory.md', 'project'],
  ['github-cynthianani-a-simple-nest.md', 'project'],
  ['github-danyuchn-iso-24495-skill.md', 'skill'],
  ['github-drumih-turbo-fieldfare.md', 'project'],
  ['github-g36maid-deepseek-harness.md', 'project'],
  ['github-harry0703-moneyprinterturbo.md', 'project'],
  ['github-hugohe3-ppt-master.md', 'project'],
  ['github-intuition-lab-personal-model.md', 'project'],
  ['github-mattpocock-skills.md', 'skill'],
  ['github-mayocream-koharu.md', 'project'],
  ['github-mensfeld-code-on-incus.md', 'project'],
  ['github-minijinai75-tavern-claude-bridge.md', 'project'],
  ['github-mirabarukaso-character-select-stand-alone-app.md', 'project'],
  ['github-moeru-ai-airi.md', 'project'],
  ['github-notoriouslab-vault-curate.md', 'project'],
  ['github-nutlope-hallmark.md', 'skill'],
  ['github-openbmb-voxcpm.md', 'project'],
  ['github-s1dashu-ip-as-logo-skill.md', 'skill'],
  ['github-stablyai-orca.md', 'project']
]);

function replaceSingle(text, pattern, replacement, label, file) {
  const matches = text.match(pattern);
  if (!matches || matches.length !== 1) {
    throw new Error(`${file}: expected exactly one ${label}.`);
  }
  return text.replace(pattern, replacement);
}

for (const [file, kind] of classifications) {
  const filePath = path.join(ROOT, file);
  if (!fs.existsSync(filePath)) throw new Error(`${file}: missing card.`);

  let text = fs.readFileSync(filePath, 'utf8');
  if (/^resource_kind:/m.test(text)) {
    throw new Error(`${file}: resource_kind already exists; migration refuses to overwrite it.`);
  }

  text = replaceSingle(
    text,
    /^source:\n  type: github\n  url: ([^\n]+)\n  identity: ([^\n]+)\n/m,
    (match) => `${match}resource_kind:\n  ai: ${kind}\n  user: null\n`,
    'GitHub source block',
    file
  );

  text = replaceSingle(text, /^updated_at: .*$/m, `updated_at: ${DATE}`, 'updated_at', file);
  text = replaceSingle(text, /^last_checked_at: .*$/m, `last_checked_at: ${DATE}`, 'last_checked_at', file);

  const entry = `## 更新紀錄\n\n### ${DATE}\n\n- 重新檢查目前 Repository，依主要交付物正式將 \`resource_kind\` 分類為 \`${kind}\`。\n`;
  text = replaceSingle(text, /^## 更新紀錄\n/m, entry, '更新紀錄 heading', file);

  fs.writeFileSync(filePath, text);
  console.log(`${file}: ${kind}`);
}

console.log(`Migrated ${classifications.size} GitHub cards.`);
