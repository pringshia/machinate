import Dag from "./dag";

export default function createGraph(schema) {
  const dag = new Dag();

  // setup dag
  Object.entries(schema)
    .filter(
      ([slotName, info]) => info.deps && Object.keys(info.deps).length > 0
    )
    .forEach(([slotName, info]) => {
      Object.entries(info.deps).map(([dep, initialState]) => {
        // console.log(slotName, dep);
        dag.add(slotName, dep, initialState);
        // console.log(dag);
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
