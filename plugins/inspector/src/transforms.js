const transitionsTransform = list => {
  const val = list.reduce(
    (info, item) => {
      if (info.last && item.toName === info.last.toName) {
        const lastItem = info.list[info.list.length - 1];
        lastItem.subItems = [...lastItem.subItems, item];
      } else {
        const newItem = { ...item, subItems: [] };
        info.list.push(newItem);
      }
      return { last: item, list: info.list };
    },
    { last: null, list: [] }
  );
  // console.log(val);
  return val;
};

export { transitionsTransform };
