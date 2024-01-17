import { items, Item } from './items';

const rowCount = 3;
const colCount = 7;
const itemsPerPage = rowCount * colCount;
export const getPosition = (item: Item) => {
  const index = items.findIndex((i) => i.key == item.key);
  const offset = index % itemsPerPage;
  const rowNumber = Math.ceil(offset / colCount);
  const colNumber = offset % colCount;
  return Math.ceil(index / itemsPerPage) + '-' + rowNumber + ',' + colNumber;
};
