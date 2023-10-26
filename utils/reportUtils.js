exports.sortPurchasedByFn = (objA, objB) => {
  return objA.purchasedBy.length - objB.purchasedBy.length;
};

exports.sortByPurchasedBy = (objectList) => {
  return objectList.sort(this.sortPurchasedByFn);
};
