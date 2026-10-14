import { mealPlan, money, shareText, shareSvg, taskPrompt } from './meal.js';

const byId = id => document.getElementById(id);
let mode = 'shared';
let fish = false;
let plan;

function render(announce = true) {
  plan = mealPlan(mode, fish);
  const base = mealPlan(mode, false);
  byId('choose-shared').setAttribute('aria-pressed', String(mode === 'shared'));
  byId('choose-budget').setAttribute('aria-pressed', String(mode === 'budget'));
  byId('shared-price').textContent = money(mealPlan('shared', fish).total);
  byId('budget-price').textContent = money(mealPlan('budget', fish).total);
  byId('people').innerHTML = plan.people.map((p, i) => `
    <article class="person ${fish && i === 1 ? 'changed' : ''}" aria-label="${p.name}的餐单">
      <div class="person-header"><span class="avatar" aria-hidden="true">${p.initial}</span><div><div class="person-name">${p.name}</div><div class="person-wish">${p.wish}</div></div><div class="person-price"><small>¥</small>${money(p.amount)}</div></div>
      <p class="person-food">${p.food}</p><p class="person-drink">${p.drink}</p><p class="person-change">${fish && i === 1 ? '换堡 +¥1.00 · 由小周承担' : ''}</p><p class="person-share">${p.shared}</p>
    </article>`).join('');
  byId('shared-food').textContent = plan.sharedFood;
  byId('total').textContent = money(plan.total);
  byId('remaining').textContent = `¥${money(plan.remaining)}`;
  byId('budget-fill').style.width = `${plan.total / 12000 * 100}%`;
  byId('budget-track').setAttribute('aria-valuenow', String(plan.total / 100));
  byId('budget-track').setAttribute('aria-valuetext', `已用 ${money(plan.total)} 元，预算 120 元，余 ${money(plan.remaining)} 元`);
  byId('shopping-list').innerHTML = plan.quote.items.map(p => `<div class="bill-row"><span>${p.productName} × ${p.quantity}</span><b>¥${money(p.subtotal)}</b></div>`).join('');
  byId('split-rule').textContent = `${plan.rule}${fish ? '小周另付 ¥1.00 换堡差价。' : ''}分摊合计等于整单金额。`;
  byId('split-sum').textContent = `${plan.people.map(p => money(p.amount)).join(' + ')} = ${money(plan.total)}`;
  byId('quote-time').textContent = `${plan.quote.time} 北京时间`;
  byId('response-link').href = plan.source;
  byId('change-meal').setAttribute('aria-pressed', String(fish));
  byId('change-meal').innerHTML = fish ? '撤回这次换堡 <span>−¥1.00</span>' : '试试换堡 <span>+¥1.00</span>';
  byId('change-caption').textContent = fish ? '导演：“换堡加一块，其他人的账照旧。”' : '这就看看，临时改餐会动到谁的账。';
  byId('change-ledger').hidden = !fish;
  byId('zhou-delta').textContent = `¥${money(base.people[1].amount)} → ¥${money(plan.people[1].amount)}`;
  byId('total-delta').textContent = `¥${money(base.total)} → ¥${money(plan.total)}`;
  byId('tradeoff').textContent = mode === 'budget'
    ? '这桌省下 ¥34.70：小林换双层吉士汉堡，小陈换椒盐风味鸡排堡；共享小食只保留一份中薯。四人的饮料需求保留。'
    : '这桌多花 ¥34.70：小林吃巨无霸，小陈吃板烧鸡腿堡；共享小食多 10 块麦乐鸡。按大家想吃的来选。';
  if (announce) byId('plan-status').textContent = `已显示${plan.title}${fish ? '、小周换麦香鱼' : ''}，整单 ${money(plan.total)} 元，预算余量 ${money(plan.remaining)} 元。`;
}

byId('choose-shared').addEventListener('click', () => { mode = 'shared'; render(); });
byId('choose-budget').addEventListener('click', () => { mode = 'budget'; render(); });
byId('change-meal').addEventListener('click', () => { fish = !fish; render(); });

const dialog = byId('share-dialog');
byId('open-share').addEventListener('click', () => {
  byId('share-text').value = shareText(plan);
  byId('share-preview').src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(shareSvg(plan))}`;
  byId('share-status').textContent = '复制或保存后，可自行转发到群里。';
  dialog.showModal();
  byId('copy-share').focus();
});
byId('close-share').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
});

async function copyText(field, status) {
  try {
    await navigator.clipboard.writeText(field.value);
    status.textContent = '已复制，可以粘贴了。';
  } catch {
    field.focus();
    field.select();
    status.textContent = '浏览器未开放剪贴板；文本已选中，可手动复制。';
  }
}
byId('copy-share').addEventListener('click', () => copyText(byId('share-text'), byId('share-status')));
byId('download-share').addEventListener('click', async () => {
  const button = byId('download-share');
  button.disabled = true;
  try {
    const image = byId('share-preview');
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 2300;
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `麦麦拼单-${plan.id}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    byId('share-status').textContent = '分享图片已生成并开始下载。';
  } catch {
    byId('share-status').textContent = '图片生成未完成，可以先复制文字餐单。';
  } finally {
    button.disabled = false;
  }
});

byId('prepare-task').addEventListener('click', () => {
  const input = byId('meal-request');
  if (!input.value.trim()) {
    byId('request-help').textContent = '先写一两句这顿饭的情况，再整理。';
    input.focus();
    return;
  }
  byId('task-text').value = taskPrompt(input.value);
  byId('task-output').hidden = false;
  byId('task-status').textContent = '任务已整理，尚未发送或核价。';
  byId('copy-task').focus();
});
byId('meal-request').addEventListener('input', () => {
  byId('task-output').hidden = true;
  byId('request-help').textContent = '本页整理任务文本，复制后到 AI 客户端运行。';
});
byId('copy-task').addEventListener('click', () => copyText(byId('task-text'), byId('task-status')));
render(false);
