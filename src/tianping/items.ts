import { Property } from './props';

export interface Item {
  key: string;
  weight: number;
  props: Property[];
}

export const originItems: Item[] = [
  { key: '铜宝箱的钥匙', props: [{ type: '使用速度' }], weight: 2 },
  { key: '圆木', props: [{ type: '最大精力' }], weight: 3 },
  { key: '枸杞', props: [{ type: '体力回复量' }], weight: 5 },
  { key: '蝌蚪', props: [{ type: '体力回复量' }], weight: 5 },
  { key: '哥布林的石板', props: [{ type: '石化抗性' }], weight: 6 },
  { key: '曼德拉', props: [{ type: '精力提升量' }], weight: 6 },
  { key: '史莱姆的眼球', props: [{ type: '最大体力' }], weight: 7 },
  { key: '铜矿石', props: [{ type: '防御力' }], weight: 8 },
  { key: '石头', props: [{ type: '防御力' }], weight: 8 },
  { key: '漂亮的骨头', props: [{ type: '防御力' }], weight: 8 },
  { key: '蜘蛛网', props: [{ type: '适应力' }], weight: 8 },
  { key: '空空如也的小瓶', props: [{ type: '适应力' }], weight: 8 },
  { key: '钥匙模具A', props: [{ type: '防御力' }], weight: 8 },
  {
    key: '铁矿石',
    props: [{ type: '防御力' }, { type: '格挡耐久' }],
    weight: 9,
  },

  { key: '木稿', props: [{ type: '效果时间' }], weight: 9 },
  {
    key: '露宿道具',
    props: [{ type: '最大体力' }, { type: '最大精力' }],
    weight: 10,
  },
  {
    key: '木炭',
    props: [{ type: '防御力' }, { type: '使用速度', level: 1 }],
    weight: 10,
  },
  { key: '恶心的肉', props: [{ type: '失明抗性' }], weight: 10 },
  { key: '铜锭', props: [{ type: '攻击力' }], weight: 11 },
  { key: '银锭', props: [{ type: '攻击力' }], weight: 11 },
  { key: '蝙蝠翅膀', props: [{ type: '攻击力' }], weight: 11 },
  { key: '木箭', props: [{ type: '攻击力' }], weight: 11 },
  {
    key: '苏摩汁',
    props: [{ type: '最大体力' }, { type: '体力回复量' }],
    weight: 12,
  },
  {
    key: '海绵蛋糕',
    props: [{ type: '最大体力' }, { type: '体力回复量' }],
    weight: 12,
  },
  {
    key: '派皮',
    props: [{ type: '使用速度' }, { type: '效果时间' }, { type: '格挡耐久' }],
    weight: 12,
  },
  {
    key: '刺刺果',
    props: [{ type: '体力回复量', level: 1 }],
    weight: 15,
  },
  {
    key: '火把',
    props: [{ type: '效果时间' }, { type: '最大体力' }],
    weight: 16,
  },
  {
    key: '小麦粉',
    props: [{ type: '石化抗性' }, { type: '失明抗性' }],
    weight: 16,
  },
  {
    key: '精力卡',
    props: [{ type: '最大精力' }, { type: '最大精力', level: 1 }],
    weight: 16,
  },
  {
    key: '装有一斗松脂的桶',
    props: [{ type: '防御力' }, { type: '效果时间' }],
    weight: 17,
  },
  {
    key: '荷包蛋吐司',
    props: [
      { type: '最大体力' },
      { type: '体力回复量' },
      { type: '精力提升量' },
    ],
    weight: 18,
  },
  {
    key: '钥匙模具B',
    props: [{ type: '防御力', level: 1 }],
    weight: 18,
  },

  {
    key: '冶炼套件',
    props: [{ type: '效果时间' }, { type: '失明抗性' }],
    weight: 19,
  },
  {
    key: '发臭腮',
    props: [{ type: '体力回复量' }, { type: '流血抗性' }],
    weight: 19,
  },

  {
    key: '石稿',
    props: [{ type: '效果时间', level: 1 }],
    weight: 19,
  },
  {
    key: '恶魔之角',
    props: [{ type: '缓慢回复' }, { type: '麻痹抗性' }],
    weight: 21,
  },
  {
    key: '一捆箭',
    props: [{ type: '攻击力', level: 1 }],
    weight: 21,
  },
  { key: '金宝箱的钥匙', props: [{ type: '金钱获取' }], weight: 22 },
  {
    key: '神酒',
    props: [{ type: '最大体力', level: 1 }, { type: '体力回复量' }],
    weight: 22,
  },
  { key: '玛瑙', props: [{ type: '金钱获取' }], weight: 22 },
  {
    key: '黄油',
    props: [{ type: '流血抗性' }, { type: '麻痹抗性' }],
    weight: 23,
  },
  {
    key: '银头骨',
    props: [{ type: '魔导力', level: 1 }],
    weight: 23,
  },
  {
    key: '肮脏的牙齿',
    props: [{ type: '剧毒抗性' }, { type: '防御力' }],
    weight: 23,
  },
  {
    key: '苹果派',
    props: [
      { type: '魔导力', level: 1 },
      { type: '减重', level: 1 },
      { type: '精力提升量' },
    ],
    weight: 23,
  },
  {
    key: '鸡蛋',
    props: [{ type: '麻痹抗性' }, { type: '剧毒抗性' }],
    weight: 24,
  },
  {
    key: '枯萎的传说药草',
    props: [{ type: '最大体力' }, { type: '体力回复量' }, { type: '缓慢回复' }],
    weight: 24,
  },
  {
    key: '木制回旋镖',
    props: [{ type: '攻击力' }, { type: '魔导力' }],
    weight: 24,
  },
  {
    key: '体力卡',
    props: [{ type: '最大体力' }, { type: '最大体力', level: 1 }],
    weight: 24,
  },
  {
    key: '一品红',
    props: [{ type: '魔导力' }, { type: '缓慢回复', level: 1 }],
    weight: 25,
  },
  {
    key: '圣水',
    props: [{ type: '石化抗性', level: 3 }],
    weight: 26,
  },

  { key: '银宝箱的钥匙', props: [{ type: '经验获取' }], weight: 23 },

  {
    key: '防御卡',
    props: [{ type: '防御力' }, { type: '防御力', level: 1 }],
    weight: 26,
  },

  {
    key: '投掷小刀',
    props: [{ type: '减重' }, { type: '攻击力' }],
    weight: 28,
  },
  {
    key: '泡芙',
    props: [
      { type: '最大体力', level: 1 },
      { type: '体力回复量' },
      { type: '精力提升量' },
    ],
    weight: 28,
  },
  {
    key: '面包',
    props: [{ type: '石化抗性' }, { type: '麻痹抗性' }, { type: '流血抗性' }],
    weight: 29,
  },
  {
    key: '阿奴迪斯的丝带',
    props: [{ type: '减重' }, { type: '使用速度', level: 1 }],
    weight: 29,
  },
  {
    key: '世界树滴露',
    props: [{ type: '减重' }, { type: '缓慢回复' }],
    weight: 29,
  },
  {
    key: '麻痹药剂',
    props: [{ type: '麻痹抗性', level: 3 }],
    weight: 29,
  },
  {
    key: '黄油松饼',
    props: [
      { type: '防御力', level: 1 },
      { type: '使用速度' },
      { type: '效果时间' },
    ],
    weight: 29,
  },
  {
    key: '铁镐',
    props: [{ type: '效果时间', level: 3 }],
    weight: 29,
  },
  {
    key: '眼药水',
    props: [{ type: '失明抗性', level: 3 }],
    weight: 30,
  },
  {
    key: '栗子',
    props: [
      { type: '石化抗性', level: 1 },
      { type: '麻痹抗性' },
      { type: '石化抗性' },
    ],
    weight: 31,
  },
  {
    key: '熔岩石块',
    props: [{ type: '防御力' }, { type: '经验获取' }],
    weight: 31,
  },
  {
    key: '蓝球',
    props: [{ type: '攻击力' }, { type: '防御力' }, { type: '魔导力' }],
    weight: 32,
  },
  {
    key: '攻击卡',
    props: [{ type: '攻击力' }, { type: '攻击力', level: 1 }],
    weight: 32,
  },
  {
    key: '重置药剂',
    props: [{ type: '魔导力', level: 3 }],
    weight: 33,
  },
  {
    key: '止血药剂',
    props: [{ type: '流血抗性', level: 3 }],
    weight: 34,
  },
  {
    key: '金刚',
    props: [{ type: '攻击力', level: 1 }, { type: '魔导力' }],
    weight: 34,
  },
  {
    key: '血清',
    props: [{ type: '剧毒抗性', level: 3 }],
    weight: 35,
  },
  {
    key: '提灯',
    props: [
      { type: '效果时间', level: 1 },
      { type: '最大体力', level: 1 },
    ],
    weight: 36,
  },
  {
    key: '魔力卡',
    props: [{ type: '魔导力' }, { type: '魔导力', level: 1 }],
    weight: 36,
  },
  {
    key: '银粘石',
    props: [
      { type: '最大精力', level: 1 },
      { type: '剧毒抗性', level: 1 },
    ],
    weight: 38,
  },
  {
    key: '奶酪',
    props: [{ type: '流血抗性' }, { type: '剧毒抗性' }, { type: '失明抗性' }],
    weight: 39,
  },
  {
    key: '起司蛋糕',
    props: [
      { type: '攻击力', level: 1 },
      { type: '格挡耐久' },
      { type: '减重' },
    ],
    weight: 39,
  },
  {
    key: '原味饼干',
    props: [{ type: '攻击力' }, { type: '魔导力' }, { type: '减重' }],
    weight: 41,
  },
  {
    key: '苹果',
    props: [
      { type: '流血抗性', level: 1 },
      { type: '麻痹抗性' },
      { type: '失明抗性' },
    ],
    weight: 43,
  },
  {
    key: '冰激凌',
    props: [
      { type: '使用速度', level: 1 },
      { type: '魔导力' },
      { type: '效果时间', level: 1 },
    ],
    weight: 44,
  },
  {
    key: '玉黄',
    props: [{ type: '金钱获取' }, { type: '经验获取' }],
    weight: 45,
  },
  {
    key: '牛奶',
    props: [
      { type: '麻痹抗性', level: 1 },
      { type: '剧毒抗性' },
      { type: '流血抗性' },
    ],
    weight: 48,
  },
  {
    key: '蒙布朗',
    props: [
      { type: '攻击力', level: 1 },
      { type: '格挡耐久', level: 1 },
      { type: '减重' },
    ],
    weight: 48,
  },
  {
    key: '金粘石',
    props: [
      { type: '最大精力', level: 3 },
      { type: '麻痹抗性', level: 3 },
    ],
    weight: 52,
  },
  {
    key: '幸运卡',
    props: [{ type: '金钱获取' }, { type: '金钱获取', level: 1 }],
    weight: 54,
  },
  {
    key: '封印奥义徽章',
    props: [
      { type: '失明抗性', level: 1 },
      { type: '石化抗性', level: 1 },
      { type: '麻痹抗性', level: 1 },
    ],
    weight: 55,
  },
  {
    key: '日记的一页',
    props: [
      { type: '缓慢回复', level: 1 },
      { type: '经验获取', level: 1 },
    ],
    weight: 55,
  },
  {
    key: '水晶镐',
    props: [
      { type: '效果时间', level: 3 },
      { type: '减重', level: 1 },
    ],
    weight: 56,
  },
  {
    key: '苹果派',
    props: [
      { type: '魔导力', level: 1 },
      { type: '减重', level: 1 },
      { type: '精力提升量' },
    ],
    weight: 56,
  },
  {
    key: '佳龙之书',
    props: [
      { type: '经验获取' },
      { type: '金钱获取' },
      { type: '魔导力', level: 1 },
    ],
    weight: 68,
  },
];

const getPropsKey = (item: Item) => {
  return item.props
    .map((p) => p.type + (p.level ?? 0))
    .sort()
    .join('');
};

const items: Item[] = [originItems[0]];
for (let i = 1; i < originItems.length; i++) {
  const item = originItems[i];
  if (
    item.weight === originItems[i - 1].weight &&
    getPropsKey(item) === getPropsKey(originItems[i - 1])
  ) {
    continue;
  } else {
    items.push(item);
  }
}

export { items };
