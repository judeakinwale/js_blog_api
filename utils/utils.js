  /**
 * @summary Update the request body with metadata
 * @param {Object} data - req.body
 * @param {import("mongoose").ObjectId} actor - req.user?._id
 * @param {Date} timestamp
 * @param {Boolean} isUpdate
 */
exports.updateMetaData = (
  data,
  actor = undefined,
  timestamp = Date.now(),
  isUpdate = false
) => {
  // * if (!actor) throw new Error("You must be logged in to perform this action")
  if (isUpdate) {
    data["updatedBy"] = actor;
    data["updatedAt"] = timestamp;
  } else {
    data["createdBy"] = actor || data["user"];
    data["user"] = data["user"] || actor;
    // * data["isActive"] = undefined
    // * data["isApproved"] = undefined
  }
};

exports.fixNestedData = (property) => {
  try {
    const cleanedProperty = String(property).replace(/\s/g, "");
    return cleanedProperty && JSON.parse(cleanedProperty);
  } catch (err) {
    return undefined;
  }
};

exports.slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

exports.sortArrayOfObjects = (
  arr,
  propertyName = "createdAt",
  order = "ascending"
) => {
  const sortedArr = arr.sort((a, b) => {
    if (a[propertyName] < b[propertyName]) {
      return -1;
    }
    if (a[propertyName] > b[propertyName]) {
      return 1;
    }
    return 0;
  });

  if (order === "descending") {
    return sortedArr.reverse();
  }

  return sortedArr;
};

exports.randomString = (len, an) => {
  an = an && an.toLowerCase();
  let str = "",
    i = 0;
  const min = an === "a" ? 10 : 0,
    max = an === "n" ? 10 : 62;
  for (; i++ < len; ) {
    let r = (Math.random() * (max - min) + min) << 0;
    str += String.fromCharCode((r += r > 9 ? (r < 36 ? 55 : 61) : 48));
  }
  return str;
};

exports.rand = () => Math.random(0).toString(36).substr(2);
exports.token = (length) =>
  (this.rand() + this.rand() + this.rand() + this.rand()).substr(0, length);

exports.toDecimal = (num, places = 2) => Number(num?.toFixed(places) || 0);

exports.handleAsync =
  (fn) =>
  async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      // Handle or log the error here
      console.error(error);
    }
  };
