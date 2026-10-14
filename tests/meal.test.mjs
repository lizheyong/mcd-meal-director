import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mealPlan, money, shareText, shareSvg } from '../docs/meal.js';

const readExample = async name => JSON.parse(await readFile(new URL(`../examples/${name}`, import.meta.url), 'utf8'));

test('member departure trial preserves remaining meals and reconciles all three official quotes', async () => {
  const summary = await readExample('skill-trial/result-summary.json');
  for (const state of [summary.before, summary.keepSnackCandidate, summary.after]) {
    const quote = await readExample(`skill-trial/${state.evidence}`);
    assert.equal(quote.success, true);
    assert.equal(state.priceCents, quote.data.price);
    assert.equal(quote.data.productList.reduce((sum, item) => sum + item.subtotal, 0), state.priceCents);
  }
  const before = await readExample('skill-trial/06-three-price-request.json');
  const keep = await readExample('skill-trial/07-two-keep-snack-price-request.json');
  const after = await readExample('skill-trial/08-two-final-price-request.json');
  assert.deepEqual(keep.items, [...before.items.slice(0, 2), before.items[3]]);
  assert.deepEqual(after.items, before.items.slice(0, 2));
  assert.equal(summary.keepSnackCandidate.priceCents - summary.after.budgetCents, summary.keepSnackCandidate.overBudgetCents);
  assert.ok(summary.after.priceCents <= summary.after.budgetCents);
  assert.equal(summary.after.priceCents - summary.before.priceCents, summary.after.totalChangeCents);
  for (const state of [summary.before, summary.after]) {
    assert.equal(state.people.reduce((sum, person) => sum + person.aaCents, 0), state.priceCents);
  }
  for (const person of summary.after.people) {
    const original = summary.before.people.find(p => p.name === person.name);
    assert.deepEqual(person.food, original.food);
    assert.equal(person.aaCents - original.aaCents, person.aaChangeCents);
  }
});

for (const mode of ['shared', 'budget']) {
  for (const fish of [false, true]) {
    test(`${mode}, fish=${fish}: display and sharing reconcile to the official response`, async () => {
      const plan = mealPlan(mode, fish);
      const original = (await readExample(`quote-${plan.id}.result.json`)).response;
      assert.equal(original.success, true);
      assert.equal(plan.total, original.data.price);
      assert.deepEqual(plan.quote.items, original.data.productList);
      assert.equal(plan.quote.time, original.datetime);
      assert.equal(plan.people.reduce((sum, p) => sum + p.amount, 0), original.data.price);
      assert.equal(plan.quote.items.reduce((sum, p) => sum + p.subtotal, 0), original.data.price);
      assert.equal(plan.remaining + plan.total, 12000);
      const request = await readExample(`quote-${plan.id}.input.json`);
      const count = items => items.reduce((counts, item) => {
        counts[item.code] = (counts[item.code] || 0) + item.quantity;
        return counts;
      }, {});
      const pictured = [
        ...plan.people.flatMap(p => [{ code: p.foodCode, quantity: 1 }, { code: p.drinkCode, quantity: 1 }]),
        ...plan.sharedItems,
      ];
      const ordered = request.items.flatMap(p => p.roundList.flatMap(r => r.comboItemList.map(c => ({ code: c.code, quantity: c.quantity * p.quantity }))));
      assert.deepEqual(count(pictured), count(ordered), 'pictured products and quantities match the quoted order');
      const text = shareText(plan);
      const svg = shareSvg(plan);
      for (const p of plan.people) {
        assert.ok(text.includes(p.food) && text.includes(`分摊 ¥${money(p.amount)}`));
        assert.ok(svg.includes(p.food) && svg.includes(`¥${money(p.amount)}`));
      }
      assert.ok(text.includes(original.datetime) && svg.includes(original.datetime));
      assert.ok(text.includes('演示') && svg.includes('演示'));
      assert.ok(text.includes(plan.source));
    });
  }

  test(`${mode}: a fish substitution changes only Zhou's burger and allocation`, async () => {
    const before = mealPlan(mode, false);
    const after = mealPlan(mode, true);
    assert.equal(after.total - before.total, 100);
    for (const i of [0, 2, 3]) assert.deepEqual(after.people[i], before.people[i]);
    assert.equal(after.people[1].amount - before.people[1].amount, 100);
    assert.equal(after.people[1].drink, before.people[1].drink);
    assert.equal(after.people[1].food, '麦香鱼');
    const request = await readExample(`quote-${before.id}.input.json`);
    request.items[1].roundList[0].comboItemList[0].code = '1600';
    assert.deepEqual(await readExample(`quote-${after.id}.input.json`), request);
  });
}

test('all four requests use documented combo choices and required quantities', async () => {
  const details = await readExample('meal-details.json');
  for (const name of ['before', 'after', 'budget', 'budget-after']) {
    const request = await readExample(`quote-${name}.input.json`);
    for (const item of request.items) {
      const detail = details.find(d => d.data.code === item.productCode).data;
      assert.equal(item.roundList.length, detail.rounds.length);
      for (const round of item.roundList) {
        const options = detail.rounds.find(r => String(r.id) === round.round);
        const quantity = round.comboItemList.reduce((sum, c) => sum + c.quantity, 0);
        assert.ok(quantity >= options.minQuantity && quantity <= options.maxQuantity);
        for (const c of round.comboItemList) assert.ok(options.choices.some(choice => choice.code === c.code));
      }
    }
  }
});
