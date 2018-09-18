import React from "react";
import Frame from "react-frame-component";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import { transitionsTransform } from "./transforms";

const INSTRUMENT = true;

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
    blacklist: []
  };
  constructor(props) {
    super(props);
    const machineState = props.onRequestInitialState();
    this.state.appState = machineState;
    this.state.transitionsList = [
      { fromName: "", toName: "INITIAL", state: machineState }
    ];
  }
  handleMessage = message => {
    if (message.source === "machinate-to-inspector") {
      this.instrument && console.log("received from parent: ", message);
      if (message.type === "state") {
        this.setState({ appState: message.data });
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
      if (message.type === "blacklist-set") {
        this.setState({ blacklist: message.data });
      }
    }
  };
  render() {
    return (
      this.props.children &&
      this.props.children({
        ...this.state,
        handleMessage: this.handleMessage.bind(this)
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
          removeFromBlacklist: this.removeFromBlacklist
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
      // console.log(machine.getState());
      // this.postToInspector("init-state", machine.getState());

      machine.addListener("transition", (type, data) =>
        this.postToInspector("transition", data)
      );
      machine.addListener("set-state", (type, data) =>
        this.postToInspector("state", data.state)
      );
      machine.addListener("force-state", (type, data) =>
        this.postToInspector("state", data.state)
      );
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
            machine.setBlacklist([".*"]);
            machine.setState(e.data.data);
          } else if (e.data.type === "set-blacklist") {
            machine.setBlacklist(e.data.data);
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
            `}</style>
          }
        >
          <InspectorState
            onRequestInitialState={this.handleRequestInitialState}
          >
            {({
              appState,
              transitionsList,
              handleMessage,
              externalsList,
              blacklist
            }) => (
              <MessageBroker onMessage={handleMessage}>
                {({ post, forceStateChange, removeFromBlacklist }) => (
                  <div>
                    <h1 style={{ marginTop: "0px" }}>
                      Inspector -{" "}
                      <span onClick={this.toggleSide}>Toggle side</span>
                    </h1>
                    <div className="container">
                      <div className="module">
                        <h3>EXTERNALS</h3>
                        {externalsList.map((external, idx) => (
                          <div key={idx}>{external.externalName}</div>
                        ))}
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
                                <div key={domain}>
                                  {domain}: {appState[domain].state}{" "}
                                  {JSON.stringify(appState[domain].data)}
                                </div>
                              ))
                            : "Undetected"}
                        </div>
                      </div>
                      <div className="module">
                        <h3>TRANSITIONS</h3>
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
