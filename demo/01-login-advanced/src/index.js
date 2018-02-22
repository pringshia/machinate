import React from "react";
import { render } from "react-dom";
import { Machinate, States } from "machinate";

class DetermineAuth extends React.Component {
  componentDidMount() {
    const username =
      window.localStorage && window.localStorage.getItem("username");

    if (username) {
      this.props.go("Auth.LoggedIn", username)();
    } else {
      this.props.go("Auth.LoggedOut")();
    }
  }
  render() {
    return null;
  }
}

class Demo extends React.Component {
  constructor(props) {
    super(props);

    this.scheme = {
      Auth: { states: ["LoggedIn", "LoggedOut", "Unknown", "Error"] },
      Display: {
        states: ["Dashboard", "Settings", "CreateItem"],
        deps: { "Auth.LoggedIn": "Dashboard" }
      },
      ItemWizard: {
        states: ["Step1", "Step2", "Step3"],
        deps: { "Display.CreateItem": "Step1" }
      }
    };

    this.initialState = {
      Auth: { state: "Unknown" }
    };
  }
  render() {
    return (
      <Machinate
        ref={ref => (window.machine = ref.state.machine)}
        scheme={this.scheme}
        initialState={this.initialState}
      >
        <States
          for="Auth"
          Unknown={(_, machine) => <DetermineAuth {...machine} />}
          Error={errorMsg => <h1>Error: {errorMsg}</h1>}
          LoggedIn={(username, { transition, go }) => (
            <div>
              {username + " is logged in "}
              <button onClick={go("Auth.LoggedOut")}>Logout</button>
              <div>
                <States
                  for="Display"
                  Settings={() => <h1>Settings</h1>}
                  Dashboard={() => (
                    <div>
                      <h1>Hello {username}</h1>
                    </div>
                  )}
                  CreateItem={() => (
                    <div>
                      <h1>Create Item</h1>
                      <States
                        for="ItemWizard"
                        Step1={() => (
                          <div>
                            Step 1{" "}
                            <button onClick={go("ItemWizard.Step2")}>
                              Next
                            </button>
                          </div>
                        )}
                        Step2={() => (
                          <div>
                            Step 2{" "}
                            <button onClick={go("ItemWizard.Step3")}>
                              Next
                            </button>
                          </div>
                        )}
                        Step3={() => <div>3</div>}
                      />
                    </div>
                  )}
                />
                <ul>
                  <li>
                    <span onClick={go("Display.Dashboard")}>Dashboard</span>
                  </li>
                  <li>
                    <span onClick={go("Display.Settings")}>Settings</span>
                  </li>
                  <li>
                    <span
                      onClick={go(
                        "Display.CreateItem" /*, "ItemWizard.Step1"*/
                      )}
                    >
                      Create Item
                    </span>
                  </li>
                </ul>
                {/* )}
                </WhenLoggedIn> */}
              </div>
            </div>
          )}
          LoggedOut={(_, { go }) => (
            <div>
              I am logged out{" "}
              <button onClick={go("Auth.LoggedIn", "pratik")}>Login</button>
            </div>
          )}
        />
      </Machinate>
    );
  }
}

render(<Demo />, document.getElementById("root"));
