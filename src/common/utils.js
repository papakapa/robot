const getLastBySeparator = (value, separator) => value.split(separator).splice(-1, 1)[0];

const removeDuplicates = (arr) => [...new Set(arr)];

module.exports = {
  getLastBySeparator,
  removeDuplicates,
};
