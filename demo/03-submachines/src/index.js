import React from "react";
import { render } from "react-dom";
import { Machinate, States } from "machinate";

class Demo extends React.Component {
  constructor(props) {
    super(props);

    this.scheme = {
      Visibility: { states: ["Show", "Hide"] }
    };
    this.initialState = {
      Visibility: { state: "Show", data: ["Block"] }
    };

    this.blockScheme = {
      Mode: { states: ["View", "Edit"] }
    };
    this.initialBlockState = data => ({
      Mode: {
        state: "View",
        data
      }
    });
  }
  render() {
    return (
      <Machinate
        scheme={this.scheme}
        initialState={this.initialState}
        ref={ref => (window.machine = ref.state.machine)}
      >
        <States
          for="Visibility"
          Show={(data, { go }) => {
            return (
              <React.Fragment>
                <button
                  onClick={go("Visibility.Show", [...data, data.length + 1])}
                >
                  Add block
                </button>

                {data.map((num, idx) => (
                  <Machinate
                    scheme={this.blockScheme}
                    initialState={this.initialBlockState(num)}
                    id={"item-" + idx}
                  >
                    <States
                      for="Mode"
                      View={(num, { transition }) => (
                        <div className="block">
                          <div>{num}</div>
                          <button
                            onClick={() => transition("Mode", "Edit", num)}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                      Edit={(editedNum, { go }) => (
                        <div className="block edit">
                          <div>
                            <input
                              value={editedNum}
                              onChange={e => go("Mode.Edit", e.target.value)()}
                            />
                          </div>
                          <button onClick={e => go("Mode.View", editedNum)()}>
                            Save
                          </button>
                          <button onClick={e => go("Mode.View", num)()}>
                            Cancel
                          </button>
                        </div>
                      )}
                    />
                  </Machinate>
                ))}
              </React.Fragment>
            );
          }}
          Hide={() => <div>Hidden</div>}
        />
      </Machinate>
    );
  }
}

render(<Demo />, document.getElementById("root"));
