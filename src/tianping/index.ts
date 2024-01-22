import { PropName } from './props';
import { run } from './run';

// 1234;

// 2345;

export const attackCommon: PropName[] = [
  '攻击力',
  '魔导力',
  '防御力',
  '经验获取',
  '使用速度',
  '效果时间',
  '最大体力',
  '最大精力',
  '精力提升量',
  '体力回复量',
  '缓慢回复',
  '格挡耐久',
  '金钱获取',
  '异常抗性',
  '麻痹抗性',
  '石化抗性',
  '失明抗性',
  '剧毒抗性',
  '流血抗性',
  '适应力',
  '减重',
];

run(5, 5, attackCommon);
