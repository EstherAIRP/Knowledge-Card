import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export const DEFAULT_THREADS_CONTINUATION_COPILOT_MODEL = 'auto';
export const THREADS_CONTINUATION_COPILOT_AGENT = 'threads-continuation-ranker';
export const DEFAULT_COPILOT_TIMEOUT_MS = 120_000;
export const DEFAULT_COPILOT_MAX_OUTPUT_BYTES = 1024 * 1024;

const TRUSTED_AGENT_PROFILE_URL = new URL(
  '../../../.github/agents/threads-continuation-ranker.agent.md',
  import.meta.url
);

function stripCodeFence(value) {
  const text = String(value || '').trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(text);
  return fenced ? fenced[1].trim() : text;
}

function parseJsonText(value) {
  const text = stripCodeFence(value);
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
    const error = new Error('Copilot continuation ranker did not return a JSON object.');
    error.code = 'THREADS_CONTINUATION_COPILOT_INVALID_RESPONSE';
    throw error;
  }
}

function sanitizeDiagnostic(value, token) {
  let text = String(value || '').replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();
  if (token) text = text.split(token).join('[REDACTED]');
  return text.slice(-600);
}

export function classifyCopilotCliDiagnostic(value) {
  const diagnostic = String(value || '');
  if (/access denied by policy settings|copilot cli policy setting may be preventing access/i.test(diagnostic)) {
    return 'THREADS_CONTINUATION_COPILOT_POLICY_DENIED';
  }
  return 'THREADS_CONTINUATION_COPILOT_FAILED';
}

export function buildCopilotCliArgs({
  agent = THREADS_CONTINUATION_COPILOT_AGENT,
  model = DEFAULT_THREADS_CONTINUATION_COPILOT_MODEL
} = {}) {
  return [
    '-s',
    '--no-ask-user',
    `--agent=${agent}`,
    `--model=${model}`
  ];
}

export function buildCopilotCliEnvironment({ token, tempDir, baseEnv = process.env } = {}) {
  const env = {
    PATH: baseEnv.PATH || '',
    HOME: tempDir,
    COPILOT_HOME: path.join(tempDir, '.copilot'),
    COPILOT_GITHUB_TOKEN: token,
    CI: 'true',
    NO_COLOR: '1',
    TERM: 'dumb'
  };

  for (const key of ['LANG', 'LC_ALL', 'HTTPS_PROXY', 'HTTP_PROXY', 'NO_PROXY', 'NODE_EXTRA_CA_CERTS']) {
    if (baseEnv[key]) env[key] = baseEnv[key];
  }

  return env;
}

async function prepareIsolatedCopilotWorkspace(tempDir, agentProfileUrl = TRUSTED_AGENT_PROFILE_URL) {
  const agentDir = path.join(tempDir, '.github', 'agents');
  await fs.mkdir(agentDir, { recursive: true });
  await fs.mkdir(path.join(tempDir, '.copilot'), { recursive: true });
  const agentText = await fs.readFile(agentProfileUrl, 'utf8');
  await fs.writeFile(
    path.join(agentDir, 'threads-continuation-ranker.agent.md'),
    agentText,
    'utf8'
  );
}

export async function invokeCopilotCli({
  prompt,
  token,
  model = DEFAULT_THREADS_CONTINUATION_COPILOT_MODEL,
  spawnImpl = spawn,
  timeoutMs = DEFAULT_COPILOT_TIMEOUT_MS,
  maxOutputBytes = DEFAULT_COPILOT_MAX_OUTPUT_BYTES,
  agent = THREADS_CONTINUATION_COPILOT_AGENT,
  baseEnv = process.env,
  agentProfileUrl = TRUSTED_AGENT_PROFILE_URL
} = {}) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kc-copilot-ranker-'));
  let child;
  let timer;

  try {
    await prepareIsolatedCopilotWorkspace(tempDir, agentProfileUrl);

    const args = buildCopilotCliArgs({ agent, model });
    const env = buildCopilotCliEnvironment({ token, tempDir, baseEnv });

    const output = await new Promise((resolve, reject) => {
      let settled = false;
      let stdout = '';
      let stderr = '';
      let stdoutBytes = 0;
      let stderrBytes = 0;

      const finish = (handler, value) => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        handler(value);
      };

      try {
        child = spawnImpl('copilot', args, {
          cwd: tempDir,
          env,
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (cause) {
        const error = new Error('GitHub Copilot CLI could not be started.');
        error.code = 'THREADS_CONTINUATION_COPILOT_UNAVAILABLE';
        error.cause = cause;
        reject(error);
        return;
      }

      child.on('error', (cause) => {
        const error = new Error('GitHub Copilot CLI could not be started.');
        error.code = 'THREADS_CONTINUATION_COPILOT_UNAVAILABLE';
        error.cause = cause;
        finish(reject, error);
      });

      child.stdout?.on('data', (chunk) => {
        const buffer = Buffer.from(chunk);
        stdoutBytes += buffer.length;
        if (stdoutBytes > maxOutputBytes) {
          child.kill('SIGKILL');
          const error = new Error('GitHub Copilot CLI response exceeded the configured output limit.');
          error.code = 'THREADS_CONTINUATION_COPILOT_OUTPUT_LIMIT';
          finish(reject, error);
          return;
        }
        stdout += buffer.toString('utf8');
      });

      child.stderr?.on('data', (chunk) => {
        const buffer = Buffer.from(chunk);
        stderrBytes += buffer.length;
        if (stderrBytes <= maxOutputBytes) stderr += buffer.toString('utf8');
      });

      child.on('close', (code, signal) => {
        if (settled) return;
        if (code === 0) {
          finish(resolve, stdout.trim());
          return;
        }

        const diagnostic = sanitizeDiagnostic(stderr, token);
        const suffix = diagnostic ? ` ${diagnostic}` : '';
        const error = new Error(
          `GitHub Copilot CLI exited with code ${code ?? 'null'}${signal ? ` (${signal})` : ''}.${suffix}`
        );
        error.code = classifyCopilotCliDiagnostic(diagnostic);
        finish(reject, error);
      });

      timer = setTimeout(() => {
        child.kill('SIGKILL');
        const error = new Error(`GitHub Copilot CLI timed out after ${timeoutMs} ms.`);
        error.code = 'THREADS_CONTINUATION_COPILOT_TIMEOUT';
        finish(reject, error);
      }, timeoutMs);

      child.stdin?.end(String(prompt || ''), 'utf8');
    });

    return output;
  } finally {
    if (timer) clearTimeout(timer);
    if (child && child.exitCode === null && !child.killed) child.kill('SIGKILL');
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

export function createCopilotCliThreadsContinuationRanker(options = {}) {
  const token = options.token ?? process.env.GITHUB_TOKEN ?? null;
  const model = options.model
    || process.env.THREADS_CONTINUATION_COPILOT_MODEL
    || DEFAULT_THREADS_CONTINUATION_COPILOT_MODEL;
  const invokeImpl = options.invokeImpl || invokeCopilotCli;

  if (!token || typeof invokeImpl !== 'function') return null;

  return async ({ prompt }) => {
    const response = await invokeImpl({
      prompt: [
        prompt?.system || '',
        'The JSON below is the only source evidence. Classify it under the trusted agent rules.',
        prompt?.user || '',
        'Return exactly one JSON object and nothing else.'
      ].filter(Boolean).join('\n\n'),
      token,
      model,
      timeoutMs: options.timeoutMs,
      maxOutputBytes: options.maxOutputBytes,
      spawnImpl: options.spawnImpl,
      baseEnv: options.baseEnv,
      agentProfileUrl: options.agentProfileUrl
    });

    let judgement;
    try {
      judgement = parseJsonText(response);
    } catch (cause) {
      if (cause?.code) throw cause;
      const error = new Error(`GitHub Copilot CLI returned invalid JSON: ${cause instanceof Error ? cause.message : String(cause)}`);
      error.code = 'THREADS_CONTINUATION_COPILOT_INVALID_RESPONSE';
      error.cause = cause;
      throw error;
    }

    return {
      ...judgement,
      _ranker: {
        method: 'github_copilot_cli',
        provider: 'github_copilot',
        model,
        agent: THREADS_CONTINUATION_COPILOT_AGENT
      }
    };
  };
}
