import React from "react";
import { render } from "react-dom";
import { Machinate, States } from "machinate";

const Demo = () => (
  <Machinate
    scheme={{ Auth: { states: ["LoggedIn", "LoggedOut", "Unknown"] } }}
    initial={{ Auth: { state: "LoggedIn" } }}
  >
    <States
      of="Auth"
      LoggedIn={() => <p>Logged in!</p>}
      LoggedOut={() => <p>Logged out!</p>}
      Unknown={() => <p>Unknown (????)</p>}
    />
  </Machinate>
);

render(<Demo />, document.getElementById("root"));
