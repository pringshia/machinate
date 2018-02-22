import React from "react";
import { render } from "react-dom";
import { Machinate, States } from "machinate";

class Demo extends React.Component {
  constructor(props) {
    super(props);

    this.scheme = {
      Items: { states: ["List"] },
      Visibility: { states: ["Show", "Hide"], deps: { "Items.List": "Show" } }
    };
    this.initialState = {
      Items: { state: "List", data: ["Block", 2] },
      Visibility: "Show"
    };

    this.blockScheme = {
      Block: { states: ["Element"] },
      Visibility: {
        states: ["Show", "Hide"],
        deps: { "Block.Element": "Show" }
      },
      Mode: { states: ["View", "Edit"], deps: { "Visibility.Show": "View" } }
    };
    this.initialBlockState = data => ({
      Block: {
        state: "Element",
        data
      },
      Visibility: {
        state: "Show"
      },
      Mode: {
        state: "View"
      }
    });
  }
  render() {
    return (
      <Machinate
        scheme={this.scheme}
        initialState={this.initialState}
        ref={ref => (window.machine = ref.state.machine)}
        key="main"
      >
        <States
          for="Items"
          List={(data, { go }) => (
            <States
              for="Visibility"
              Show={() => {
                return (
                  <React.Fragment>
                    <button onClick={go("Visibility.Hide")}>
                      Toggle Show/Hide
                    </button>
                    <button
                      onClick={go("Items.List", [...data, data.length + 1])}
                    >
                      Add block
                    </button>

                    {data.map((num, idx) => (
                      <Machinate
                        scheme={this.blockScheme}
                        initialState={this.initialBlockState(num)}
                        key={"item-" + idx}
                        id={"item-" + idx}
                      >
                        <States
                          for="Block"
                          Element={(num, { transition }) => (
                            <States
                              for="Mode"
                              View={() => (
                                <div className="block">
                                  <div>{num}</div>
                                  <button
                                    onClick={() =>
                                      transition("Mode", "Edit", num)
                                    }
                                  >
                                    Edit
                                  </button>
                                </div>
                              )}
                              Edit={(editedNum, { go }) => (
                                <div className="block edit">
                                  <div>
                                    <input
                                      key={idx}
                                      value={editedNum}
                                      onChange={e =>
                                        go("Mode.Edit", e.target.value)()
                                      }
                                    />
                                  </div>
                                  <button
                                    onClick={e =>
                                      go("Block.Element", editedNum)()
                                    }
                                  >
                                    Save
                                  </button>
                                  <button onClick={e => go("Mode.View", num)()}>
                                    Cancel
                                  </button>
                                </div>
                              )}
                            />
                          )}
                        />
                      </Machinate>
                    ))}
                  </React.Fragment>
                );
              }}
              Hide={() => (
                <div>
                  <button onClick={go("Visibility.Show")}>
                    Toggle Show/Hide
                  </button>
                </div>
              )}
            />
          )}
        />
      </Machinate>
    );
  }
}

render(<Demo />, document.getElementById("root"));
