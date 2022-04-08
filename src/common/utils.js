const getLastBySeparator = (value, separator) => value.split(separator).splice(-1, 1)[0];

const removeDuplicates = (arr) => [...new Set(arr)];

const formatTextSymbols = (text) => text.replace(/\s+/g, " ").replace(/[^a-zA-Z-9А-Яа-я ]/g, "").toLowerCase();

const asyncFilter = async (arr, predicate) => {
  const res = await Promise.all(arr.map(predicate));

  return res.filter(({ predicateResult }) => predicateResult).map(({ value }) => value);
}

const getSafeField = (value, maxLength) => value ? value.length > maxLength ? value.slice(0, maxLength).concat('...') : value : null;

module.exports = {
  getLastBySeparator,
  getSafeField,
  removeDuplicates,
  formatTextSymbols,
  asyncFilter,
};
