import React from "react";
import Frame from "react-frame-component";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import { transitionsTransform } from "./transforms";
import ReactJson from "react-json-view";
import c from "classnames";

const INSTRUMENT = true;
const GLOBAL_REGEX_BLACKLIST = "^(?!router).*";

// const transitionsTransform = list => {
//   const val = list.reduce(
//     (info, item) => {
//       if (info.last && item.toName === info.last.toName) {
//         const lastItem = info.list[info.list.length - 1];
//         lastItem.subItems = [...lastItem.subItems, item];
//       } else {
//         const newItem = { ...item, subItems: [] };
//         info.list.push(newItem);
//       }
//       return { last: item, list: info.list };
//     },
//     { last: null, list: [] }
//   );
//   // console.log(val);
//   return val;
// };

function bindEvent(element, eventName, eventHandler) {
  if (element.addEventListener) {
    element.addEventListener(eventName, eventHandler, false);
  } else if (element.attachEvent) {
    element.attachEvent("on" + eventName, eventHandler);
  }
}

class InspectorState extends React.Component {
  instrument = INSTRUMENT;
  state = {
    appState: null,
    transitionsList: [],
    blockAllExternals: false,
    externalsList: [],
    blockedExternalsList: [],
    blacklist: [],
    scheme: {}
  };
  constructor(props) {
    super(props);
    const machineState = props.onRequestInitialState();
    this.state.appState = machineState;
    this.state.transitionsList = [
      { fromName: "", toName: "INITIAL", state: machineState }
    ];
  }
  clearExternalsList = () =>
    this.setState({ externalsList: [], blockedExternalsList: [] });
  clearTransitionsList = () => this.setState({ transitionsList: [] });

  handleMessage = message => {
    if (message.source === "machinate-to-inspector") {
      this.instrument && console.log("received from parent: ", message);
      if (message.type === "state") {
        this.setState({ appState: message.data.state });
      }
      if (message.type === "transition") {
        this.setState({
          transitionsList: [...this.state.transitionsList, message.data]
        });
      }
      if (message.type === "external-executed") {
        this.setState({
          externalsList: [...this.state.externalsList, message.data]
        });
      }
      if (message.type === "external-blocked") {
        this.setState({
          blockedExternalsList: [
            ...this.state.blockedExternalsList,
            message.data
          ]
        });
      }

      if (message.type === "blacklist-set") {
        this.setState({ blacklist: message.data });
      }
      if (message.type === "init-scheme") {
        this.setState({ scheme: message.data });
      }
    }
  };
  render() {
    return (
      this.props.children &&
      this.props.children({
        ...this.state,
        handleMessage: this.handleMessage.bind(this),
        clearExternalsList: this.clearExternalsList.bind(this),
        clearTransitionsList: this.clearTransitionsList.bind(this)
      })
    );
  }
}

class MessageBroker extends React.Component {
  postFromInspector = (type, data) => {
    const window = this.window;

    if (window) {
      window.parent.postMessage(
        { source: "machinate-from-inspector", type, data },
        "*"
      );
    }
  };

  forceStateChange = state => () => {
    this.postFromInspector("force-state", state);
  };

  removeFromBlacklist = (blacklist, regexToRemove) => () => {
    this.postFromInspector(
      "set-blacklist",
      blacklist.filter(regex => regex !== regexToRemove)
    );
  };

  hasHadAPayloadHistorically = (domainName, stateName, transitionsList) => {
    const toStateName = domainName + "." + stateName;
    const filtered = transitionsList.filter(
      t => t.toName === toStateName && !!t.payload
    );

    return filtered.length > 0;
  };

  transitionTo = (
    domainName,
    stateName,
    hasPayload = false,
    transitionsList
  ) => e => {
    e.stopPropagation();
    if (hasPayload) {
      const toStateName = domainName + "." + stateName;
      const filtered = transitionsList.filter(
        t => t.toName === toStateName && !!t.payload
      );
      const defaultPayload =
        filtered.length === 0
          ? undefined
          : filtered[filtered.length - 1].payload;

      this.postFromInspector("invoke-transition", {
        state: toStateName,
        payload:
          JSON.parse(
            prompt("Input the payload: ", JSON.stringify(defaultPayload))
          ) || undefined
      });
    } else {
      this.postFromInspector("invoke-transition", {
        state: domainName + "." + stateName,
        payload: undefined
      });
    }
  };

  componentDidMount() {
    this.window = this.context && this.context.window;

    // this.postFromInspector("Hello!");

    if (this.window) {
      bindEvent(this.window, "message", e => {
        this.props.onMessage(e.data);
      });
    }
  }

  render() {
    return (
      (this.props.children &&
        this.props.children({
          post: this.postFromInspector,
          forceStateChange: this.forceStateChange,
          removeFromBlacklist: this.removeFromBlacklist,
          transitionTo: this.transitionTo,
          hasHadAPayloadHistorically: this.hasHadAPayloadHistorically
        })) ||
      null
    );
  }
}
MessageBroker.contextTypes = {
  window: PropTypes.any,
  document: PropTypes.any
};

class Inspector extends React.Component {
  instrument = INSTRUMENT;
  state = { leftSide: false };
  postToInspector = (type, data) => {
    const frame = ReactDOM.findDOMNode(this.iframe);
    frame.contentWindow.postMessage(
      { source: "machinate-to-inspector", type, data },
      "*"
    );
  };
  toggleSide = () => {
    this.setState({ leftSide: !this.state.leftSide });
  };
  handleRequestInitialState = () => {
    const machine = this.context && this.context.machine;
    if (window && machine) {
      return machine.getState();
    }
    return null;
  };
  componentDidMount() {
    const machine = this.context && this.context.machine;

    if (window && machine) {
      this.setState({ initialState: machine.getState() });

      // TODO: Only send this over once on initialization.
      // Figure out how to detect initialization. This is NOT efficient
      // and very spammy.
      machine.addListener("set-state", (type, data) => {
        this.postToInspector("init-scheme", machine.getDomainInfo());
      });

      machine.addListener("transition", (type, data) =>
        this.postToInspector("transition", data)
      );
      machine.addListener("set-state", (type, data) => {
        this.postToInspector("state", {
          state: data.state,
          forcedBy: data.forcedBy
        });
      });
      machine.addListener("force-state", (type, data) => {
        if (data.forcedBy === "blacklist") return;

        this.postToInspector("state", {
          state: data.state,
          forcedBy: data.forcedBy
        });
      });
      machine.addListener("blacklist-set", (type, data) =>
        this.postToInspector("blacklist-set", data)
      );
      machine.addListener("external-blocked", (type, data) =>
        this.postToInspector("external-blocked", data)
      );
      machine.addListener("external-executed", (type, data) =>
        this.postToInspector("external-executed", data)
      );

      machine.addListener("log", (type, data) => console.log(data));

      bindEvent(window, "message", e => {
        if (e.data.source === "machinate-from-inspector") {
          this.instrument && console.log("received from child", e.data);
          if (e.data.type === "transition") {
            machine.transition(
              [],
              ...e.data.data.name.split("."),
              e.data.data.payload
            );
          } else if (e.data.type === "force-state") {
            machine.setBlacklist([GLOBAL_REGEX_BLACKLIST]);
            machine.setState(e.data.data);
          } else if (e.data.type === "set-blacklist") {
            machine.setBlacklist(e.data.data);
          } else if (e.data.type === "invoke-transition") {
            machine.setBlacklist([GLOBAL_REGEX_BLACKLIST]);
            machine.transition([], e.data.data.state, e.data.data.payload);
          }
        }
      });
    }
  }

  render() {
    return (
      <div
        style={{
          position: "fixed",
          top: "0",
          ...(this.state.leftSide ? { left: 0 } : { right: 0 }),
          height: "100vh",
          width: "300px", // TODO: make resizable
          zIndex: 999
        }}
      >
        <Frame
          ref={ref => {
            if (ref) {
              this.iframe = ref;
            }
          }}
          style={{ border: "0", height: "100vh" }}
          head={
            <style>{`
            * { box-sizing: border-box; }
            html, body {margin:0; padding: 0; font-family: Arial, serif; }
            body { background-color: #efefef; color: #3f3f3f; border-left: 1px solid #aaaaaa; border-right: 1px solid #aaaaaa; min-height: 100vh; }
            .container { padding: 20px 15px; font-size: 12px; }
            html { height: 100vh; }
            h1 { font-size: 14px; margin: 0; padding: 10px 15px; background-color: #d0d0d0; color: #333; border-bottom: 1px solid #777; }
            h1, h3 { text-transform: uppercase; font-size: 11px; letter-spacing: 1px; }
            h3 { margin: 0 0 5px 0; padding: 0 0 4px 0; border-bottom: 1px solid #d0d0d0; }
            .module { margin-bottom: 30px; }
            .transition { margin-bottom: 3px; }
            .pointer { cursor: pointer; }
            .state-name.active { background-color: #fffa18; font-weight: bold; }
            .state-name { cursor: pointer; padding: 1px 3px; background-color: #ddd; border-radius: 2px; margin-right: 3px }
            `}</style>
          }
        >
          <InspectorState
            onRequestInitialState={this.handleRequestInitialState}
          >
            {({
              appState,
              scheme,
              transitionsList,
              clearTransitionsList,
              handleMessage,
              externalsList,
              blockedExternalsList,
              clearExternalsList,
              blacklist
            }) => (
              <MessageBroker onMessage={handleMessage}>
                {({
                  post,
                  forceStateChange,
                  removeFromBlacklist,
                  transitionTo,
                  hasHadAPayloadHistorically
                }) => (
                  <div>
                    <h1 style={{ marginTop: "0px" }}>
                      <span role="img" aria-label="inspector logo">
                        🔍
                      </span>{" "}
                      Inspector -{" "}
                      <span onClick={this.toggleSide}>Toggle side</span>
                      {blacklist.some(b => b === GLOBAL_REGEX_BLACKLIST) && (
                        <span
                          role="img"
                          aria-label="play button"
                          style={{
                            float: "right",
                            fontSize: 17,
                            position: "relative",
                            bottom: 5,
                            cursor: "pointer"
                          }}
                          onClick={removeFromBlacklist(
                            blacklist,
                            GLOBAL_REGEX_BLACKLIST
                          )}
                        >
                          ▶️
                        </span>
                      )}
                    </h1>
                    <div className="container">
                      <div className="module">
                        <h3>
                          EXTERNALS
                          <span
                            style={{
                              marginLeft: 10,
                              fontSize: 8,
                              cursor: "pointer"
                            }}
                            onClick={clearExternalsList}
                          >
                            Clear
                          </span>
                        </h3>
                        <div style={{ display: "flex" }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: "3px 0 5px" }}>Executed</h4>
                            {externalsList.map((external, idx) => (
                              <div key={idx}>{external.externalName}</div>
                            ))}
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: "3px 0 5px" }}>Blocked</h4>
                            {blockedExternalsList.map((external, idx) => (
                              <div key={idx}>{external.externalName}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <h3>BLACKLISTED EXTERNALS</h3>
                      <div className="module">
                        {blacklist.map((regex, idx) => (
                          <div
                            key={idx}
                            onClick={removeFromBlacklist(blacklist, regex)}
                          >
                            {regex}
                          </div>
                        ))}
                      </div>
                      <div className="module">
                        <h3>STATE</h3>
                        <div style={{ height: "200px", overflowY: "scroll" }}>
                          {appState
                            ? Object.keys(appState).map(domain => (
                                <div
                                  key={domain}
                                  style={{ marginTop: 3, marginBottom: 5 }}
                                >
                                  {domain}:{" "}
                                  {/* <strong className="state-name active">
                                    {appState[domain].state}
                                  </strong>{" "} */}
                                  {scheme &&
                                    scheme[domain] &&
                                    scheme[domain].states.map(state => (
                                      <span
                                        key={state}
                                        className={c("state-name", {
                                          active:
                                            state === appState[domain].state
                                        })}
                                        onClick={transitionTo(
                                          domain,
                                          state,
                                          false,
                                          transitionsList
                                        )}
                                      >
                                        {state}
                                        &nbsp;
                                        <span
                                          role="img"
                                          aria-label="payload button"
                                          onClick={transitionTo(
                                            domain,
                                            state,
                                            true,
                                            transitionsList
                                          )}
                                        >
                                          {hasHadAPayloadHistorically(
                                            domain,
                                            state,
                                            transitionsList
                                          )
                                            ? "📦"
                                            : "🗑"}
                                        </span>
                                      </span>
                                    ))}
                                  {appState[domain].data && (
                                    <div style={{ marginBottom: 10 }}>
                                      <ReactJson
                                        name={false}
                                        src={appState[domain].data}
                                        displayDataTypes={false}
                                        indentWidth={1}
                                        enableClipboard={false}
                                      />
                                    </div>
                                  )}
                                  {/* <code>
                                    {JSON.stringify(appState[domain].data)}
                                  </code> */}
                                </div>
                              ))
                            : "Undetected"}
                        </div>
                      </div>
                      <div className="module">
                        <h3>
                          TRANSITIONS
                          <span
                            style={{
                              marginLeft: 10,
                              fontSize: 8,
                              cursor: "pointer"
                            }}
                            onClick={clearTransitionsList}
                          >
                            Clear
                          </span>
                        </h3>
                        <div>
                          {transitionsTransform(transitionsList).list.map(
                            (t, idx) =>
                              t.subItems.length >= 1 ? (
                                <div className="transition" key={idx}>
                                  {t.fromName} ➡ {t.toName}{" "}
                                  {[t, ...t.subItems].map((sub, idx2) => (
                                    <em
                                      className="pointer"
                                      key={idx + "-" + idx2}
                                      onClick={forceStateChange(sub.state)}
                                    >
                                      •{" "}
                                    </em>
                                  ))}
                                </div>
                              ) : (
                                <div
                                  className="transition pointer"
                                  key={idx}
                                  onClick={forceStateChange(t.state)}
                                >
                                  {t.fromName} ➡ {t.toName}{" "}
                                  <em>{t.payload ? "with payload" : ""}</em>
                                </div>
                              )
                          )}
                        </div>
                      </div>
                      {/* <button
                    onClick={() =>
                      post("transition", {
                        name: "Auth.LoggedIn",
                        payload: new Date()
                      })
                    }
                  >
                    Transition
                  </button> */}
                    </div>
                  </div>
                )}
              </MessageBroker>
            )}
          </InspectorState>
        </Frame>
      </div>
    );
  }
}

Inspector.contextTypes = {
  machine: PropTypes.object
};

export { Inspector };
