const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { askInteractiveQuestion, answerInteractiveQuestion } = require('../dist/cli/questionEngine');
const { loadState } = require('../dist/cli/context');

test('Interactive Divide & Conquer Question Engine Unit Tests', async (t) => {
  const scratchDir = path.join(__dirname, 'scratch_question_test');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const statePath = path.join(scratchDir, '.inuo-state.json');
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);

  await t.test('creates SingleChoice interactive question when user prompt is vague', () => {
    const q = askInteractiveQuestion(
      'SingleChoice',
      'Which specific service do you require?',
      ['Emergency Water Supply', 'Engine Repair', 'Medical Consultation'],
      undefined,
      scratchDir
    );

    assert.strictEqual(q.questionType, 'SingleChoice');
    assert.strictEqual(q.options.length, 3);
    assert.strictEqual(q.isAnswered, false);

    const state = loadState(statePath);
    assert.strictEqual(state.interactiveQuestions.length, 1);
  });

  await t.test('answers SingleChoice question with valid single option selection', () => {
    const state = loadState(statePath);
    const qId = state.interactiveQuestions[0].questionId;

    const res = answerInteractiveQuestion(qId, ['Emergency Water Supply'], scratchDir);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.question.isAnswered, true);
    assert.strictEqual(res.question.selectedOptions[0], 'Emergency Water Supply');
  });

  await t.test('rejects multiple selections for SingleChoice question', () => {
    const q = askInteractiveQuestion(
      'SingleChoice',
      'Choose primary contact channel',
      ['SMS', 'Email', 'Phone Call'],
      undefined,
      scratchDir
    );

    const res = answerInteractiveQuestion(q.questionId, ['SMS', 'Email'], scratchDir);
    assert.strictEqual(res.success, false);
    assert.match(res.message, /SingleChoice question allows selecting only 1 option/);
  });

  await t.test('creates and answers MultipleChoice question with multiple option selections', () => {
    const q = askInteractiveQuestion(
      'MultipleChoice',
      'Select required relief supplies',
      ['Blankets', 'Food Packets', 'First Aid Kits', 'Hygiene Packets'],
      undefined,
      scratchDir
    );

    const res = answerInteractiveQuestion(q.questionId, ['Blankets', 'Food Packets'], scratchDir);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.question.selectedOptions.length, 2);
  });

  // Cleanup
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
  if (fs.existsSync(scratchDir)) fs.rmSync(scratchDir, { recursive: true, force: true });
});
