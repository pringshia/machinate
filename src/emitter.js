// I whipped up the below emitter, is it worth it to use a supported one?
// https://github.com/Olical/EventEmitter/blob/master/docs/guide.md

const emitter = function() {
  let listeners = {};
  const addListener = (type, listener) => {
    listeners[type] =
      listeners[type] && Array.isArray(listeners[type])
        ? [...listeners[type], listener]
        : [listener];
  };
  const removeListener = (type, listener) => {
    listeners[type] =
      listeners[type] && Array.isArray(listeners[type])
        ? listeners[type].filter(l => l !== listener)
        : [];
  };
  const emit = (type, data) => {
    if (type instanceof RegExp) {
      Object.keys(listeners)
        .filter(key => type.test(key))
        .forEach(key => {
          const list = listeners[key];
          if (list && Array.isArray(list)) {
            list.forEach(l => l(type, data));
          }
        });
    } else {
      listeners[type] &&
        Array.isArray(listeners[type]) &&
        listeners[type].forEach(l => l(type, data));
    }
  };

  return {
    addListener,
    removeListener,
    emit
  };
};

export default emitter;
