/**
 * @typedef {Object} Fns
 * @property {Function} onCall Function to call when debounce function is called
 * @property {Function} onComplete Function to call when debounce function is completed
 */

/**
 * Function to create a debounce function
 * @param {function} func Function to debounce
 * @param {number} msWait Number of milliseconds to wait before calling function
 * @param {Fns} fns Object with functions to call
 * @returns {function} Debounce function
 */
module.exports = function debounce (func, msWait = 1000, fns = { onCall: function () {}, onComplete: function () {} }) {
  let timeout
  const { onCall, onComplete } = fns
  return function (...args) {
    const context = this
    clearTimeout(timeout)

    if (onCall && typeof onCall === 'function') {
      onCall.apply(context, args)
    }

    timeout = setTimeout(() => {
      func.apply(context, args)

      if (onComplete && typeof onComplete === 'function') {
        onComplete.apply(context, args)
      }
    }, msWait)
  }
}
