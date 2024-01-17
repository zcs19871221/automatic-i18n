import { PropsList } from './props';
import { run } from './run';

export const magicBoss: PropsList = [
  ['魔导力'],
  ['最大体力', '最大精力', '防御力', '精力提升量'],
  ['格挡耐久', '体力回复量', '使用速度', '效果时间', '异常抗性'],
];
export const attackBoss: PropsList = [
  ['攻击力'],
  ['最大体力', '最大精力', '防御力', '精力提升量'],
  ['格挡耐久', '减重', '体力回复量', '使用速度', '效果时间', '异常抗性'],
];
export const magicCommon: PropsList = [
  ['魔导力'],
  ['金钱获取', '经验获取'],
  ['最大体力', '最大精力', '防御力', '精力提升量'],
  ['格挡耐久', '体力回复量', '效果时间'],
];
export const attackCommon: PropsList = [
  ['攻击力'],
  ['金钱获取', '经验获取'],
  [
    '最大体力',
    '效果时间',
    '最大精力',
    '防御力',
    '精力提升量',
    '减重',
    '格挡耐久',
    '异常抗性',
  ],
];

run(2, 2, magicCommon);
