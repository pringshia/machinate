export const expandSchemeSyntax = scheme =>
  Object.entries(scheme).reduce((obj, [domainName, value]) => {
    if (Array.isArray(value)) {
      obj[domainName] = { states: value };
    } else {
      obj[domainName] = value;
    }
    return obj;
  }, {});

export const expandStateSyntax = state =>
  Object.entries(state).reduce((obj, [domainName, value]) => {
    if (typeof value === "string") {
      obj[domainName] = { state: value };
    } else {
      obj[domainName] = value;
    }
    return obj;
  }, {});

export const resolveSubdomain = (state, scope, domainName) => {
  const allVariations = ["", ...scope]
    .map((_, idx, array) => array.slice(0, array.length - idx))
    .map(possibleScopes => ({
      fullName: [...possibleScopes.slice(1), domainName].join("/"),
      prefix:
        possibleScopes.slice(1).length === 0
          ? ""
          : [...possibleScopes.slice(1), ""].join("/")
    }));

  const variations = allVariations.map(v => v.fullName);
  const prefixVariations = allVariations.map(v => v.prefix);

  const allPossibilities = allVariations.filter(variation =>
    state.hasOwnProperty(variation.fullName)
  );

  const possibilities = allPossibilities.map(p => p.fullName);
  const prefixPossibilities = allPossibilities.map(p => p.prefix);

  if (possibilities.length === 0)
    return {
      prefix: prefixVariations[0],
      prefixArray: prefixVariations[0].split("/").filter(Boolean),
      fullName: variations[0]
    };

  if (possibilities.length > 1) {
    console.warn(
      `Possible ambiguity in transitioning within domain named '${domainName}'.` +
        ` Machinate will transition to the most specific one, '${
          possibilities[0]
        }', but you may have meant to transition to ${possibilities
          .slice(1)
          .map(name => `'${name}'`)
          .join(
            " or "
          )}. It is recommended to be more specific to avoid unintended behavior.`
    );
  }
  return {
    prefix: prefixPossibilities[0],
    prefixArray: prefixPossibilities[0].split("/").filter(Boolean),
    fullName: possibilities[0]
  };
};

export const isTransitionable = (scope, scheme, currentState, toState) => {
  const toDomainName = toState.split(".")[0];

  const prefix = scope.length === 0 ? "" : [scope, ""].join("/");

  console.log(scope, toState);
  const domainInfo = scheme[toDomainName];
  if (!domainInfo.deps) return true;

  const deps = Object.keys(domainInfo.deps);
  return deps.every(dep => {
    const [domainName, stateName] = dep.split(".");
    return Boolean(
      currentState[prefix + domainName] &&
        currentState[prefix + domainName].state === stateName
    );
  });
};
