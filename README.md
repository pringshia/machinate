# 🕵️‍♂️ machinate

[![npm](https://img.shields.io/npm/v/machinate.svg)]()

#### **⚠️ Not yet ready for production use.**

---

**machinate (mack·in·eight)** _verb_:

* _Practical, simple, and hassle-free state management._

* _A cutesy reverse [portmanteau](https://en.wikipedia.org/wiki/Portmanteau) of "state machine"_.

* _To engage in plots and intrigues; scheme. (This is what your app does if you're not managing state properly, we'll help put an end to that.)_

---

### 🏁 **Goals**:

* 🚀 Instantly launch your app in any given state.
* 🤓 Heavy emphasis on developer experience. Your time and sanity are respected.
* 🚼 Baked in best practices. Guardrails for guidance.
* 🍞 Dead simple. Plain javascript objects. Minimal boilerplate.
* 🛠 High quality tooling.

# Install

`yarn add machinate`

# Use

Every app has states. 1) Define them. 2) Implement them. 3) Connect them.

### **1. define your app's states**

```jsx
// object where keys are a domain, values are the states of that domain.

const scheme = {
  Auth: ["LoggedIn", "LoggedOut", "Unknown"]
};
```

### **2. implement the states**

```jsx
import { Machinate, States } from "machinate";

const initialState = { Auth: "LoggedOut" };

const App = (
    <Machinate
        scheme={scheme}
        initial={initialState}>

        <States for="Auth"
            LoggedIn={...}
            LoggedOut={...}
            Unknown={...}
        />
    </Machinate>
);

ReactDOM.render(<App />, document.body)
```

---

**💡 Tip!**
If you forget to implement a state, `machinate` will warn you:

```jsx
<States for="Auth"
    LoggedIn={...}
    LoggedOut={...}
    // 'Unknown' prop left out intentionally
>
```

`web console:`

```
Warning: Failed prop type: The prop `Unknown` is marked as required in `Auth[Domain]`, but its value is `undefined`.
```

---

### **3. connecting states**

Each state prop receives two parameters:

1. the data, if any, associated with the state
2. a collection of helper methods to manipulate the machine

One such helper method is `go()`:

```jsx
<States for="Auth"
    LoggedIn={data => <h1>Hi {data.user}</h1>}
    LoggedOut={(data, { go }) => (
        <button
            onClick={ go("Auth.LoggedIn", {user: "bob"}) }
            value="Login"
        />
    )}
    Unknown={() => null)}
/>
```

**Note:** `"Auth.LoggedIn"` is shorthand notation, referring to the `LoggedIn` state of the `Auth` domain.

---

### 🔀 Syntactic Shortcuts

The following are all equivalent:

```jsx
const scheme = {
  Auth: ["LoggedIn", "LoggedOut"]
};

const scheme = {
  Auth: {
    states: ["LoggedIn", "LoggedOut"],
    deps: []
  }
};
```

```jsx
const initialState = {
  Auth: "LoggedOut"
};

const initialState = {
  Auth: {
    state: "LoggedOut",
    data: null
  }
};
```
