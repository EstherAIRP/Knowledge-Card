import fs from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';

const SCHEMA_URL = new URL(
  '../../../schema/threads-continuation-judgement.schema.json',
  import.meta.url
);

export const THREADS_CONTINUATION_JUDGEMENT_SCHEMA_PATH = 'schema/threads-continuation-judgement.schema.json';

export const threadsContinuationJudgementSchema = JSON.parse(
  fs.readFileSync(SCHEMA_URL, 'utf8')
);

export const THREADS_CONTINUATION_JUDGEMENT_REQUIRED_FIELDS = Object.freeze([
  ...(threadsContinuationJudgementSchema.required || [])
]);

export const THREADS_CONTINUATION_JUDGEMENT_ALLOWED_LABELS = Object.freeze([
  ...(threadsContinuationJudgementSchema.$defs?.candidateLabel?.properties?.label?.enum || [])
]);

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateSchema = ajv.compile(threadsContinuationJudgementSchema);

function schemaCandidate(value, allowRankerMetadata) {
  if (!allowRankerMetadata || !value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }
  const { _ranker: _ignoredRankerMetadata, ...judgement } = value;
  return judgement;
}

function formatErrors(errors = []) {
  return errors.map((error) => {
    const location = error.instancePath || '/';
    return `${location} ${error.message || 'is invalid'}`.trim();
  });
}

export function validateThreadsContinuationJudgementShape(value, options = {}) {
  const candidate = schemaCandidate(value, options.allowRankerMetadata === true);
  const valid = validateSchema(candidate);
  return {
    valid: Boolean(valid),
    errors: valid ? [] : formatErrors(validateSchema.errors)
  };
}

export function assertThreadsContinuationJudgementShape(value, options = {}) {
  const result = validateThreadsContinuationJudgementShape(value, options);
  if (result.valid) return value;

  const error = new Error(
    `Threads continuation judgement does not match ${THREADS_CONTINUATION_JUDGEMENT_SCHEMA_PATH}: ${result.errors.join('; ')}`
  );
  error.code = 'THREADS_CONTINUATION_JUDGEMENT_SCHEMA_INVALID';
  error.validation_errors = result.errors;
  throw error;
}
