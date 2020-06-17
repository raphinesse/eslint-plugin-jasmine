'use strict'

// Matches X.{and,withArgs(Y)}.returnValue(Z)
const SpyStrategyCall = `
  CallExpression:matches(
    [callee.object.property.name=and],
    [callee.object.callee.property.name=withArgs]
  )
`.replace(/\s+/g, ' ').trim()
const ReturnStrategyCtor = `${SpyStrategyCall}[callee.property.name=returnValue]`

// Matches Promise.{resolve,reject}(X)
const PromiseCall = 'CallExpression[callee.object.name=Promise]'
const SettledPromiseCtor = `${PromiseCall}[callee.property.name=/resolve|reject/]`

module.exports = function (context) {
  return {
    // TODO: Change to "FOO:has(> BAR)" once available in esquery
    [`${ReturnStrategyCtor} > ${SettledPromiseCtor}.arguments:first-child`] (promiseCall) {
      const returnStrategyCall = context.getAncestors().slice(-1)[0]
      const returnValueMethod = returnStrategyCall.callee.property
      const preferredMethod = promiseCall.callee.property.name === 'resolve'
        ? 'resolveTo' : 'rejectWith'

      context.report({
        message: `Prefer ${preferredMethod}`,

        loc: {
          start: returnValueMethod.loc.start,
          end: returnStrategyCall.loc.end
        },

        fix (fixer) {
          const promiseVal = promiseCall.arguments[0]
          const promiseValText = promiseVal
            ? context.getSourceCode().getText(promiseVal)
            : ''

          return [
            fixer.replaceText(promiseCall, promiseValText),
            fixer.replaceText(returnValueMethod, preferredMethod)
          ]
        }
      })
    }
  }
}
