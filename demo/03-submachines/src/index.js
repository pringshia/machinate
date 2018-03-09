import React from "react";
import { render } from "react-dom";
import { Machinate, States, State, Submachine, withState } from "machinate";
import { Inspector } from "machinate-plugins-inspector";

class Demo extends React.Component {
  constructor(props) {
    super(props);

    this.scheme = {
      Items: { states: ["List"] },
      Visibility: { states: ["Show", "Hide"], deps: { "Items.List": "Show" } },
      Block: { states: ["Element"] },
      BlockVisibility: {
        states: ["Show", "Hide"],
        deps: { "Block.Element": "Show" }
      },
      Mode: {
        states: ["View", "Edit"],
        deps: { "BlockVisibility.Show": "View" }
      }
    };
    this.initialState = {
      Items: { state: "List", data: ["Block", 2] },
      Visibility: "Show"
    };

    this.initialBlockState = data => ({
      Block: {
        state: "Element",
        data
      },
      BlockVisibility: {
        state: "Show"
      },
      Mode: {
        state: "View"
      }
    });
  }
  render() {
    const WhenVisibleHoC = withState("Visibility.Show", () => <span>All</span>);
    return (
      <Machinate
        scheme={this.scheme}
        initial={this.initialState}
        ref={ref => (window.machine = ref.state.machine)}
        key="main"
      >
        <Inspector />
        <h2 data-test="list-header">
          My List -{" "}
          <State of="Visibility.Hide">{() => <span>Hidden</span>}</State>
          <WhenVisibleHoC />
        </h2>
        <States
          for="Items"
          List={({ data, go }) => (
            <States
              for="Visibility"
              Show={() => {
                return (
                  <React.Fragment>
                    <button
                      data-test="toggle-visibility"
                      onClick={go("Visibility.Hide")}
                    >
                      Toggle Show/Hide
                    </button>
                    <button
                      data-test="add-block"
                      onClick={go("Items.List", [...data, data.length + 1])}
                    >
                      Add block
                    </button>

                    <div className="list-container">
                      {data.map((num, idx) => (
                        <Submachine
                          key={"item-" + idx}
                          id={"item-" + idx}
                          initial={this.initialBlockState(num)}
                        >
                          <States
                            for="Block"
                            Element={({ data: num, transition }) => (
                              <States
                                for="Mode"
                                View={() => (
                                  <div className="block">
                                    <div data-test={"text-" + idx}>{num}</div>
                                    <button
                                      data-test={"change-mode-" + idx}
                                      onClick={() =>
                                        transition("Mode", "Edit", num)
                                      }
                                    >
                                      Edit
                                    </button>
                                  </div>
                                )}
                                Edit={({ data: editedNum, go, transition }) => {
                                  return (
                                    <div className="block edit">
                                      <div>
                                        <input
                                          data-test={"input-" + idx}
                                          key={idx}
                                          value={editedNum}
                                          onChange={e =>
                                            go("Mode.Edit", e.target.value)()
                                          }
                                        />
                                      </div>
                                      <button
                                        data-test={"save-" + idx}
                                        onClick={e => {
                                          const newData = [...data];
                                          newData[idx] = editedNum;

                                          go("Items.List", newData)();
                                          go("Mode.View")();
                                        }}
                                      >
                                        Save
                                      </button>
                                      <button
                                        data-test={"async-clear-" + idx}
                                        onClick={e => {
                                          setTimeout(
                                            () =>
                                              transition("Mode", "Edit", ""),
                                            2000
                                          );
                                        }}
                                      >
                                        Clear
                                      </button>
                                      <button
                                        data-test={"cancel-mode-" + idx}
                                        onClick={e => go("Mode.View", num)()}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  );
                                }}
                              />
                            )}
                          />
                        </Submachine>
                      ))}
                    </div>
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
