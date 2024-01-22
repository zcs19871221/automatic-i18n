import { Item, items } from './items';
import { PropName } from './props';

interface NewItem extends Item {
  priority: number;
  propNames: string[];
  used: boolean;
}
export function run(
  leftCount: number,
  rightCount: number,
  orderedProps: PropName[]
) {
  console.time('usedTime');

  const weightMapItems: Record<string, NewItem[]> = {};
  const newItems: NewItem[] = [];
  const orderedPropsWithPriority: {
    propName: string;
    priority: number;
  }[] = [];
  const propNameMapPriority: Record<string, number> = {};
  orderedProps.forEach((prop, index) => {
    for (let i = 4; i > 0; i--) {
      const name = prop + i;
      const priority = orderedProps.length - index + i;
      orderedPropsWithPriority.push({
        propName: name,
        priority,
      });
      propNameMapPriority[name] = priority;
    }
  });

  orderedPropsWithPriority.sort((a, b) => b.priority - a.priority);

  const pushOrCreate = (
    target: Record<string, NewItem[]>,
    key: string,
    value: NewItem
  ) => {
    target[key] ??= [];
    target[key].push(value);
    target[key] = target[key];
  };

  const descendingObj = (obj: Record<string, NewItem[]>) => {
    Object.keys(obj).forEach((key) => {
      obj[key] = obj[key].sort((a, b) => b.priority - a.priority);
    });
  };

  items.map((item) => {
    const newItem: NewItem = {
      ...item,
      priority: 0,
      used: false,
      propNames: [],
    };
    let priority = 0;

    pushOrCreate(weightMapItems, String(item.weight), newItem);
    item.props.forEach((p) => {
      const level = !p.level ? 1 : p.level + 1;
      const propName = p.type + level;
      priority += propNameMapPriority[propName] ?? 0;

      newItem.propNames.push(propName);
    });
    newItem.priority = priority;
    newItems.push(newItem);
  });

  descendingObj(weightMapItems);
  newItems.sort((a, b) => b.priority - a.priority);

  const picked: NewItem[] = [];
  const pickedProps: string[] = [];
  let index = 0;
  while (picked.length < leftCount + rightCount - 1) {
    const current = newItems[index++];
    if (
      current.propNames.some((name) => pickedProps.some((pp) => pp === name))
    ) {
      continue;
    }
    current.used = true;
    picked.push(current);
    pickedProps.push(...current.propNames);
  }

  const max = Math.min(leftCount, rightCount);
  const total = picked.reduce((a, b) => a + b.weight, 0);
  let finalPickedRight: NewItem[] = [];
  let lastLeftItemToPick: NewItem | null = null;
  const getItemsProps = (items: NewItem[]) => {
    return items.reduce((acc: string[], cur) => {
      acc.push(...cur.propNames);
      return acc;
    }, []);
  };
  const count = (rightPicked: NewItem[], index: number = 0) => {
    if (rightPicked.length === max) {
      const curPickedWeightSum = rightPicked.reduce(
        (acc, cur) => acc + cur.weight,
        0
      );
      const lastItemWeight = 2 * curPickedWeightSum - total;
      const matchedItems = weightMapItems[lastItemWeight];
      if (!matchedItems) {
        return;
      }
      const lastItem = matchedItems.find((e) => {
        return (
          !e.used &&
          !e.propNames.some((p) => !pickedProps.some((fpp) => fpp === p))
        );
      });
      if (
        lastItem &&
        (!lastLeftItemToPick || lastLeftItemToPick.priority < lastItem.priority)
      ) {
        lastLeftItemToPick = lastItem;
        finalPickedRight = [...rightPicked];
      }
      return;
    }
    for (let i = index; i < picked.length; i++) {
      rightPicked.push(picked[index]);
      picked[index].used = true;
      count(rightPicked, index + 1);
      picked[index].used = false;
      rightPicked.pop();
    }
  };
  count([], 0);
  const left: NewItem[] = [];
  picked.forEach((p) => {
    if (!finalPickedRight.includes(p)) {
      left.push(p);
    }
  });
  console.log('left:' + left.map((l) => l.key).join(','));
  console.log('right:' + finalPickedRight.map((r) => r.key).join(','));
  console.log(
    'props: ' +
      getItemsProps(left.concat(finalPickedRight)).sort().reverse().join(',')
  );

  console.timeEnd('usedTime');
}
