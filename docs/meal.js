import { quotes } from './quotes.js';

export const repository = 'https://github.com/lizheyong/mcd-meal-director';
export const members = [
  { name: '小林', initial: '林', wish: '不吃辣', drink: '可乐中杯' },
  { name: '小周', initial: '周', wish: '不要含糖饮料', drink: '无糖可口可乐中杯' },
  { name: '小陈', initial: '陈', wish: '想吃鸡肉', drink: '可乐中杯' },
  { name: '小许', initial: '许', wish: '想一起分小食', drink: '可乐中杯' },
];
export const money = fen => (fen / 100).toFixed(2);

// These are recorded examples. Free-form meal requests are handled by the Skill.
export function mealPlan(mode, fish) {
  const shared = mode === 'shared';
  const id = shared ? (fish ? 'after' : 'before') : (fish ? 'budget-after' : 'budget');
  const quote = quotes[id];
  const base = shared ? [2508, 2508, 2507, 2507] : [1640, 1640, 1640, 1640];
  const foods = shared
    ? ['巨无霸', '高达吉士双牛堡', '板烧鸡腿堡', '麦香鸡']
    : ['双层吉士汉堡', '高达吉士双牛堡', 'Hold不住鸡排堡（椒盐风味）', '麦香鸡'];
  if (fish) foods[1] = '麦香鱼';
  const people = members.map((member, i) => ({
    ...member, food: foods[i], amount: base[i] + (fish && i === 1 ? 100 : 0),
    shared: shared ? `麦乐鸡 ${[3, 2, 3, 2][i]} 块 · 共享中薯` : '共享中薯条',
  }));
  return {
    id, mode, fish, quote, people, total: quote.price, remaining: 12000 - quote.price,
    title: shared ? '共享多一点' : '小食少一点',
    sharedFood: shared ? '麦乐鸡 10 块 + 中薯条 1 份' : '中薯条 1 份',
    rule: shared
      ? '基础餐费按约定 AA，小林、小周各承担 1 分舍入尾差。'
      : '基础餐费按约定 AA，每人 16.40 元。',
    source: `${repository}/blob/main/examples/quote-${id}.result.json`,
  };
}

export function shareText(plan) {
  return [
    `麦麦拼单导演｜${plan.title} · 演示餐单`,
    '账算明白，拼单不烧心。',
    '',
    '麦当劳上海徐家汇餐厅 · 到店取餐',
    '天钥桥路 1 号 · 4 人 · 预算 ¥120.00',
    '',
    ...plan.people.map(p => `${p.name}｜${p.food} + ${p.drink}\n${p.shared}｜分摊 ¥${money(p.amount)}`),
    '',
    `整桌共享：${plan.sharedFood}（已计入套餐，购买一次）`,
    `整单 ¥${money(plan.total)}｜预算余量 ¥${money(plan.remaining)}`,
    plan.rule,
    plan.fish ? '小周换麦香鱼加价 ¥1.00，由小周承担；其他人的分摊不变。' : '',
    '',
    '向门店购买：',
    ...plan.quote.items.map(p => `${p.productName} × ${p.quantity}｜¥${money(p.subtotal)}`),
    '',
    `官方核价时间：${plan.quote.time}（北京时间）`,
    '人物与需求为演示案例，金额为历史接口快照，未下单。',
    '实际餐品与价格以下单时官方结果为准。',
    `核价依据：${plan.source}`,
    'https://lizheyong.github.io/mcd-meal-director/',
  ].filter((line, i, list) => line !== '' || list[i - 1] !== '').join('\n');
}

export function taskPrompt(requirements) {
  return `用 $mcd-meal-director 帮我安排这顿麦当劳。\n\n${requirements.trim()}\n\n请理解每个人的自然语言需求，查询实际门店和菜单，组织分人餐单与完整购物清单。存在值得比较的取舍时，给出有差异的候选并逐一官方核价，说明省了什么、改了什么。明确共享归属、分摊约定与核价时间。发生改餐时保留仍适用的需求，重新核算完整清单并解释每人的变化。最后生成可转发的餐单。这次先做配餐草案。`;
}

export function shareSvg(plan) {
  const rows = plan.people.map((p, i) => {
    const y = 264 + i * 132;
    return `<g><text x="44" y="${y}" font-size="23" font-weight="700">${p.name}</text><text x="556" y="${y}" text-anchor="end" font-size="27" font-weight="700">¥${money(p.amount)}</text><text x="44" y="${y + 35}" font-size="22">${p.food}</text><text x="44" y="${y + 65}" font-size="17" fill="#68665d">${p.drink} · ${p.shared}</text><path d="M44 ${y + 87}H556" stroke="#ddd8c7" stroke-dasharray="4 5"/></g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="1150" viewBox="0 0 600 1150"><rect width="600" height="1150" rx="24" fill="#fffdf5"/><g font-family="PingFang SC,Microsoft YaHei,sans-serif" fill="#282b26"><rect x="24" y="24" width="552" height="153" rx="16" fill="#ffe17e"/><text x="44" y="61" font-size="16" letter-spacing="2">麦麦拼单导演 / 演示餐单</text><text x="44" y="111" font-size="36" font-weight="800">账算明白，拼单不烧心。</text><text x="44" y="149" font-size="18">${plan.title} · 4 人 · 到店取餐</text><text x="44" y="213" font-size="19">上海徐家汇餐厅 · 天钥桥路 1 号</text>${rows}<text x="44" y="790" font-size="19">整桌共享：${plan.sharedFood}</text><text x="44" y="823" font-size="16" fill="#68665d">共享品已计入套餐 · 基础餐费按约定 AA</text><text x="44" y="866" font-size="18">整单合计</text><text x="556" y="880" text-anchor="end" font-size="47" font-weight="800">¥${money(plan.total)}</text><text x="44" y="921" font-size="18">预算余量 ¥${money(plan.remaining)}${plan.fish ? ' · 小周自付 ¥1.00 换堡差价' : ''}</text><path d="M44 950H556" stroke="#ddd8c7"/><text x="44" y="987" font-size="16">官方核价 ${plan.quote.time}（北京时间）</text><text x="44" y="1019" font-size="16" fill="#68665d">人物为演示案例，金额为历史快照，未下单。</text><text x="44" y="1047" font-size="16" fill="#68665d">实际餐品与价格以下单时官方结果为准。</text><text x="44" y="1100" font-size="17">lizheyong.github.io/mcd-meal-director/</text></g></svg>`;
}
