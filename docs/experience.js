import { mealPlan, money } from './meal.js';

const base = mealPlan('shared', false);
const changed = mealPlan('shared', true);
const panel = document.getElementById('flow-panel');
const play = document.getElementById('play-flow');
const steps = [...document.querySelectorAll('.flow-step')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const scenes = [
  `<div class="flow-kicker">你的需求</div><p class="flow-question">“四个人，120 元。<br>口味不一样，还想一起分小食。”</p><div class="flow-personas">${base.people.map(p => `<span><b>${p.name}</b>${p.wish}</span>`).join('')}</div><p class="flow-caption" style="margin-top:20px">到店取餐 · 上海徐家汇 · 按约定 AA</p>`,
  `<div class="flow-kicker">官方菜单 → 套餐详情 → 实际选配</div><p class="flow-question">3 份套餐，<br>安排 4 个人的一餐。</p><div class="flow-list">${base.quote.items.map(p => `<div><b>${p.productName}</b><small>× ${p.quantity} · ¥${money(p.subtotal)}</small></div>`).join('')}</div><p class="flow-caption" style="margin-top:15px">堡堡随心拼分给小林、小陈，小食整桌共享。<br>采购清单按套餐计一次，餐品再分到每个人。</p>`,
  `<div class="flow-kicker">CALCULATE-PRICE / 官方整单核价</div><p class="flow-question">预算内，分摊也对得上。</p><div class="flow-amount"><small>¥</small>${money(base.total)}</div><p class="flow-caption">预算 ¥120，还余 ¥${money(base.remaining)}。<br>三份套餐按真实选项组成整单，提交官方核价。</p><div class="flow-split">${base.people.map(p => money(p.amount)).join(' + ')}<br><span class="flow-caption">= ¥${money(base.total)} · 1 分尾差按约定分配</span></div>`,
  `<div class="flow-kicker">继续同一个对话</div><p class="flow-question">“小周换麦香鱼，<br>无糖可乐保留，差价自己付。”</p><div class="flow-swap"><img src="./assets/food/1600.png" alt="换成麦香鱼" width="110" height="92"><div><strong>+ ¥${money(changed.total - base.total)}</strong><p class="flow-caption">小周分摊 ¥${money(base.people[1].amount)} → ¥${money(changed.people[1].amount)}</p></div></div><p class="flow-caption">重算整单：¥${money(base.total)} → ¥${money(changed.total)}<br>另外三人的餐品与分摊保留，无糖可乐照旧。</p>`,
];

let step = 0;
let playback;
function showStep(index) {
  step = index;
  steps.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  panel.innerHTML = scenes[index];
  if (!reducedMotion.matches) panel.animate([{ opacity: .25, transform: 'translateY(9px)' }, { opacity: 1, transform: 'none' }], { duration: 350, easing: 'ease-out' });
}
function stopPlayback() {
  clearInterval(playback);
  playback = undefined;
  play.textContent = '播放过程 ▷';
}
steps.forEach((button, i) => button.addEventListener('click', () => { stopPlayback(); showStep(i); }));
play.addEventListener('click', () => {
  if (playback) { stopPlayback(); return; }
  showStep(0);
  play.textContent = '暂停播放 Ⅱ';
  playback = setInterval(() => { showStep(step + 1); if (step === scenes.length - 1) stopPlayback(); }, 2200);
});
document.addEventListener('visibilitychange', () => { if (document.hidden) stopPlayback(); });
showStep(0);

const presets = {
  lunch: '我们四个人在上海徐家汇到店取餐，预算 120 元。小林不吃辣，小周要无糖饮料，小陈想吃鸡肉，小许想分享小食。基础餐费大家同意 AA，临时加价自己付。',
  change: '接着刚才的餐单：小周想把汉堡换成麦香鱼，无糖可乐保留，差价由小周自己付。请保留其他人的需求，重新核价，告诉我整单和每个人的费用变化。',
  leave: '接着刚才的餐单：小许临时不来了。剩下三个人预算一共 60 元，保留各自的主餐和饮料偏好，共享小食可以取消。重新组织套餐、核价和分摊。',
};
document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-preset]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  const input = document.getElementById('meal-request');
  input.value = presets[button.dataset.preset];
  input.dispatchEvent(new Event('input', { bubbles: true }));
  document.getElementById('request-help').textContent = button.dataset.preset === 'lunch'
    ? '按你的情况改写，复制后到已配置的 AI 客户端运行。'
    : '这是后续需求，请在已有餐单的同一段 AI 对话中使用。';
}));

// Reveal each section once; all content stays available without JavaScript.
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    if (!reducedMotion.matches) entry.target.animate([{ opacity: .35, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], { duration: 550, easing: 'cubic-bezier(.2,.7,.2,1)' });
    observer.unobserve(entry.target);
  }
}, { threshold: .1 });
document.querySelectorAll('.section-head,.trial-cards,.install-section,.composer-paper').forEach(element => observer.observe(element));

for (const id of ['choose-shared', 'choose-budget', 'change-meal']) document.getElementById(id).addEventListener('click', () => {
  if (reducedMotion.matches) return;
  document.getElementById('people').animate([{ opacity: .4, transform: 'translateY(7px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'ease-out' });
  document.getElementById('total').animate([{ backgroundColor: '#ffdc5480' }, { backgroundColor: 'transparent' }], { duration: 600 });
});
