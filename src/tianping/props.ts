export const allProps = [
  '最大体力',
  '最大精力',
  '攻击力',
  '防御力',
  '魔导力',
  '格挡耐久',
  '体力回复量',
  '减重',
  '精力提升量',
  '缓慢回复',
  '使用速度',
  '效果时间',
  '经验获取',
  '金钱获取',
  '异常抗性',
  '麻痹抗性',
  '石化抗性',
  '失明抗性',
  '剧毒抗性',
  '流血抗性',
  '适应力',
] as const;

export interface Property {
  type: (typeof allProps)[number];
  level?: 0 | 1 | 2 | 3;
}

export type PropName = Property['type'];
