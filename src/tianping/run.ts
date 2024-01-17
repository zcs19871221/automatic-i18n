import { Item, items as inputItems } from './items';
import { getPosition } from './getPosition';
import { Property, PropsList } from './props';

interface DP {
  notAdd?: DP;
  addedLeft?: {
    item: Item;
    prev?: DP;
  };
  addedRight?: {
    item: Item;
    prev?: DP;
  };
  minLeftCount: number;
  minRightCount: number;
}

export function run(
  leftCount: number,
  rightCount: number,
  propsToFilter: PropsList
) {
  console.time('usedTime');
  const allPropsRequire = propsToFilter.reduce(
    (acc: any[], cur: Property['type'][]) => {
      acc.push(...cur);
      return acc;
    },
    []
  );
  const items = inputItems.filter((item) => {
    return item.props.every((p) => allPropsRequire.includes(p.type));
  }) as Item[];

  let dp: { [weight: number]: DP } = {};
  let prevDp: { [weight: number]: DP } = {};

  dp[0] = {
    minLeftCount: 0,
    minRightCount: 0,
  };
  dp[items[0].weight] = {
    addedLeft: {
      item: items[0],
    },
    minLeftCount: 1,
    minRightCount: 0,
  };

  const extract = (left: Item[], right: Item[]) => {
    const handleItems = (items: Item[], left: boolean = false) => {
      const props = new Set<string>();
      const names: [string, number][] = [...items]
        .sort((a, b) => a.weight - b.weight)
        .map((item) => {
          return [item.key + ':' + getPosition(item), item.weight];
        });

      items.forEach((item) => {
        item.props.forEach((prop) => {
          props.add(prop.type + '-' + (prop.level ?? 0));
        });
      });

      return { names, props };
    };

    const leftInfo = handleItems(left, true);
    const rightInfo = handleItems(right);

    const props = new Set([...leftInfo.props, ...rightInfo.props]);
    const propsString = [...props].join('');
    if (
      propsToFilter.every((p) => p.every((pp) => !propsString.includes(pp)))
    ) {
      return;
    }
    props.forEach((prop) => {
      if (leftInfo.props.has(prop) && rightInfo.props.has(prop)) {
        props.delete(prop);
      }
    });
    const names =
      leftInfo.names
        .sort((a, b) => a[1] - b[1])
        .map((each) => each[0])
        .join(' ') +
      '\n' +
      rightInfo.names
        .sort((a, b) => a[1] - b[1])
        .map((each) => each[0])
        .join(' ');
    if (filteredGroups.find((f) => f.names === names)) {
      return;
    }
    filteredGroups.push({
      names,
      props: [...props].sort(),
    });
  };

  const getProps = (items: Item[]) => {
    const props: string[] = [];
    items.forEach((item) => {
      item.props.forEach((prop) => {
        props.push(prop.type + (prop.level ?? 0));
      });
    });
    return props;
  };

  const overlapProps = (props: string[][], item: Item) => {
    const itemProps = getProps([item]);
    const allProps: string[] = [];
    props.forEach((p) => {
      allProps.push(...p);
    });
    return itemProps.some((prop) => allProps.includes(prop));
  };

  const travers = (
    dp: DP | undefined,
    left: Item[] = [],
    right: Item[] = [],
    props: string[][] = []
  ) => {
    if (left.length > leftCount || right.length > rightCount) {
      return;
    }
    if (!dp) {
      if (left.length === leftCount && right.length === rightCount) {
        // console.log(left, right);
        extract(left, right);
      }
      return;
    }
    const { notAdd, addedLeft, addedRight } = dp;
    if (notAdd) {
      travers(notAdd, left, right, props);
    }

    const handleItem = (
      item:
        | {
            item: Item;
            prev?: DP | undefined;
          }
        | undefined,
      group: Item[]
    ) => {
      if (item && !overlapProps(props, item.item)) {
        group.push(item.item);
        props.push(getProps([item.item]));
        travers(item.prev, left, right, props);
        props.pop();
        group.pop();
      }
    };
    handleItem(addedLeft, left);
    handleItem(addedRight, right);
  };

  const countProp = (props: string[], targetProps: string[]) => {
    let count = 0;
    props.forEach((prop) => {
      const [pureName, level] = prop.split('-');
      if (targetProps.includes(pureName)) {
        count += Number(level) + 1;
      }
    });
    return count;
  };

  const sum = items
    .slice(-(leftCount + rightCount) / 2)
    .reduce((a, b) => a + b.weight, 0);

  const filteredGroups: { names: string; props: string[] }[] = [];

  for (let i = 1; i < items.length; i++) {
    prevDp = dp;
    dp = {};
    const item = items[i];
    const itemWeight = item.weight;
    for (let j = -sum; j <= sum; j++) {
      const beforeNotAdd = prevDp[j];
      const beforePickLeft = prevDp[j - itemWeight];
      const beforePickRight = prevDp[j + itemWeight];
      let minLeftCount = 0;
      let minRightCount = 0;
      let notAdd;
      let addedLeft;
      let addedRight;
      if (beforeNotAdd) {
        minLeftCount = beforeNotAdd.minLeftCount;
        minRightCount = beforeNotAdd.minRightCount;
        notAdd = beforeNotAdd;
      }

      if (beforePickLeft) {
        addedLeft = {
          item,
          prev: beforePickLeft,
        };
        minLeftCount = Math.max(minLeftCount, beforePickLeft.minLeftCount + 1);
        minRightCount = Math.max(minRightCount, beforePickLeft.minRightCount);
      }
      if (beforePickRight) {
        addedRight = {
          item,
          prev: beforePickRight,
        };
        minRightCount = Math.max(
          minRightCount,
          beforePickRight.minRightCount + 1
        );
        minLeftCount = Math.max(minLeftCount, beforePickRight.minLeftCount);
      }
      if (notAdd && !addedLeft && !addedRight) {
        dp[j] = {
          ...notAdd,
        };
      } else if (notAdd || addedLeft || addedRight) {
        dp[j] = {
          notAdd,
          addedLeft,
          addedRight,
          minLeftCount: minLeftCount,
          minRightCount: minRightCount,
        };
      }
    }
  }

  travers(dp[0]);

  filteredGroups.sort((a, b) => {
    for (let i = 0; i < propsToFilter.length; i++) {
      const targetProps = propsToFilter[i];

      const countA = countProp(a.props, targetProps);
      const countB = countProp(b.props, targetProps);
      if (countA !== countB) {
        return countB - countA;
      }
    }

    return b.props.length - a.props.length;
  });

  for (let i = 0; i < Math.min(10, filteredGroups.length); i++) {
    console.log(filteredGroups[i].names);
    console.log(filteredGroups[i].props.join(','));
    console.log('-----\n');
  }

  console.timeEnd('usedTime');
}
