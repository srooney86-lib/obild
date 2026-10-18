const fs = require('fs');

const origReadlink = fs.readlink;
fs.readlink = function (...args) {
  const cb = args[args.length - 1];
  args[args.length - 1] = function (err, linkString) {
    if (err && err.code === 'EISDIR') err.code = 'EINVAL';
    cb(err, linkString);
  };
  return origReadlink.apply(this, args);
};

const origPromisesReadlink = fs.promises.readlink;
fs.promises.readlink = async function (...args) {
  try {
    return await origPromisesReadlink.apply(this, args);
  } catch (err) {
    if (err && err.code === 'EISDIR') err.code = 'EINVAL';
    throw err;
  }
};