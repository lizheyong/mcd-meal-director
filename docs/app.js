import { mealPlan, money, shareText, shareSvg, foodImage } from './meal.js';

const byId = id => document.getElementById(id);
const plan = mealPlan('shared', false);

function render() {
  byId('people').innerHTML = plan.people.map(p => `
    <article class="person" aria-label="${p.name}的餐单">
      <div class="person-header"><span class="avatar" aria-hidden="true">${p.initial}</span><div><div class="person-name">${p.name}</div><div class="person-wish">${p.wish}</div></div><div class="person-price"><small>¥</small>${money(p.amount)}</div></div>
      <div class="person-meal"><div class="person-photos"><img class="food-photo" src="${foodImage(p.foodCode)}" alt="${p.food}" width="200" height="150"><img class="drink-photo" src="${foodImage(p.drinkCode)}" alt="${p.drink}" width="150" height="150"></div><div class="person-details"><p class="person-food">${p.food}</p><p class="person-drink">${p.drink}</p></div></div><p class="person-share">${p.shared}</p>
    </article>`).join('');
  byId('shared-food').textContent = plan.sharedFood;
  byId('shared-photos').innerHTML = plan.sharedItems.map(p => `<figure><img src="${foodImage(p.code)}" alt="${p.name}" width="100" height="80"><figcaption>${p.name} × ${p.quantity}</figcaption></figure>`).join('');
  byId('total').textContent = money(plan.total);
  byId('remaining').textContent = `¥${money(plan.remaining)}`;
  byId('budget-fill').style.width = `${plan.total / 12000 * 100}%`;
  byId('budget-track').setAttribute('aria-valuenow', String(plan.total / 100));
  byId('budget-track').setAttribute('aria-valuetext', `已用 ${money(plan.total)} 元，预算 120 元，余 ${money(plan.remaining)} 元`);
  byId('shopping-list').innerHTML = plan.quote.items.map(p => `<div class="bill-row"><span>${p.productName} × ${p.quantity}</span><b>¥${money(p.subtotal)}</b></div>`).join('');
  byId('split-rule').textContent = `${plan.rule}分摊合计等于整单金额。`;
  byId('split-sum').textContent = `${plan.people.map(p => money(p.amount)).join(' + ')} = ${money(plan.total)}`;
  byId('quote-time').textContent = `${plan.quote.time} 北京时间`;
  byId('response-link').href = plan.source;
}

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

byId('copy-starter').addEventListener('click', async () => {
  const text = byId('starter-text').textContent;
  try {
    await navigator.clipboard.writeText(text);
    byId('starter-status').textContent = '已复制，到你的 Agent 对话里发送。';
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(byId('starter-text'));
    selection.removeAllRanges();
    selection.addRange(range);
    byId('starter-status').textContent = '示例已选中，可以直接复制。';
  }
});
render();
