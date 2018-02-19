# machinate

#### **⚠️ Not ready yet for production use.**

---

_Practical state management._

_A cutesy reverse [portmeanteau](https://en.wikipedia.org/wiki/Portmanteau) of "state machine"_.

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

const initialState =

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

_ProTip: The fully qualified definition of a scheme is:_

```
const scheme = {
    Auth: {
        states: ["LoggedIn", "LoggedOut"],
        deps: []
    }
}
```

However, the domain (e.g. in the above case, the `Auth` key) can simply reference an array instead of an object if the domain has no _dependencies_, as shown above.

More on _dependencies_ later.

###
