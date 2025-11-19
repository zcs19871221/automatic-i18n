/**
 * 处理一个文件中的所有冲突块，执行“accept both changes”策略。
 */
export default function resolveGitConflicts(content: string): {
  changed: boolean;
  output: string;
} {
  const startMarker = '<<<<<<< ';
  const midMarker = '=======';
  const endMarker = '>>>>>>>';

  let i = 0;
  let changed = false;
  const out: string[] = [];

  while (i < content.length) {
    const startIdx = content.indexOf(startMarker, i);
    if (startIdx === -1) {
      out.push(content.slice(i));
      break;
    }
    // push 前面非冲突部分
    out.push(content.slice(i, startIdx));
    const midIdx = content.indexOf(midMarker, startIdx);
    if (midIdx === -1) {
      // 非完整冲突，直接推剩余
      out.push(content.slice(startIdx));
      break;
    }
    const endIdx = content.indexOf(endMarker, midIdx);
    if (endIdx === -1) {
      out.push(content.slice(startIdx));
      break;
    }

    // 计算每个块的结束位置（行末）
    const afterEndLineIdx = content.indexOf('\n', endIdx);
    const conflictEndPos =
      afterEndLineIdx === -1 ? content.length : afterEndLineIdx + 1;

    // 提取两侧内容（去掉首尾换行以便后续处理）
    const leftPart = content
      .slice(content.indexOf('\n', startIdx) + 1, midIdx)
      .replace(/^\n+|\n+$/g, '');
    const rightPart = content
      .slice(content.indexOf('\n', midIdx) + 1, endIdx)
      .replace(/^\n+|\n+$/g, '');

    // “accept both”：保留左 + 右
    let merged = leftPart + (leftPart && rightPart ? '\n' : '') + rightPart;

    out.push(merged.endsWith('\n') ? merged : merged + '\n');
    changed = true;
    i = conflictEndPos;
  }

  return { changed, output: out.join('') };
}
