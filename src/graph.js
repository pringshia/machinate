import Dag from "./dag";

export default function createGraph(schema) {
  const dag = new Dag();

  // setup dag
  Object.entries(schema)
    .filter(
      ([domainName, info]) => info.deps && Object.keys(info.deps).length > 0
    )
    .forEach(([domainName, info]) => {
      Object.entries(info.deps).forEach(([dep, initialState]) => {
        dag.add(domainName, dep, initialState);
      });
    });

  // if toState has no edges, return empty array
  // if toState has edges, return the node, plus it's dependents
  const getDependents = (state, toState) => {
    const childDependents = dag.edgesTo(toState).edges[toState];

    const flatMap = function(arr, lambda) {
      return Array.prototype.concat.apply([], arr.map(lambda));
    };

    return !childDependents
      ? []
      : flatMap(childDependents, node => [
          node,
          ...getDependents(
            state,
            state[node.f] && node.f + "." + state[node.f].state
          )
        ]);
  };

  return {
    getDependents
  };
}
