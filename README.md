# machinate

#### **⚠️ Not ready yet for production use.**

---

_Practical state management._

_A cutesy reverse [portmanteau](https://en.wikipedia.org/wiki/Portmanteau) of "state machine"_.

---

### 🏁 **Goals**:

* ✨ Instantly launch your app in any given state.
* 🤓 Heavy emphasis on developer experience. Your time and sanity are respected.
* 🚼 Baked in best practices. Guardrails for guidance.
* 🍞 Dead simple. Plain javascript objects.
* 🛠 High quality tooling.

# Install

`yarn add machinate`

# Use

Every app has states. 1) Define them. 2) Implement them.

### **1. define your app's states**

```
// object where keys are a domain, values are the states of that domain.

const scheme = {
    Auth: ["LoggedIn", "LoggedOut"]
}
```

### **2. implement the states**

```
import Machinate from "machinate";

const initialState = { Auth: "LoggedOut };

const App = (
    <Machinate
        scheme={scheme}
        initialState={initialState}>

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

```
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

### 🔀 Syntactic Shortcuts

The following are all equivalent:

```
const scheme = {
    Auth: ["LoggedIn", "LoggedOut"]
}

const scheme = {
    Auth: {
        states: ["LoggedIn", "LoggedOut"],
        deps: []
    }
}
```

```
const initialState = {
    Auth: "LoggedOut"
}

const initialState = {
    Auth: {
        state: "LoggedOut",
        info: null
    }
}
```
