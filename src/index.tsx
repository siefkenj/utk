// @ts-ignore
window.global ||= window;

import React from "react";
import ReactDOM from "react-dom/client";
// Hooks for using redux
import { StoreProvider, createStore } from "easy-peasy";
// keep redux data stored persistently
import { persistStore, persistReducer } from "redux-persist";
import { PersistGate } from "redux-persist/integration/react";
// local storage backend for redux-persist
import storage from "redux-persist/lib/storage";
// make sure all tabs get updated when data changes
import { crosstabSync } from "./libs/redux-persist-crosstab";

import "./css/index.css";
import App from "./App";

// Data model
import { model } from "./model/model";
// Set up our model so that our data is persisted with
// local storage.
const PERSIST_KEY = "utkstorage";
const store = createStore(model, {
    reducerEnhancer: (reducer) =>
        persistReducer(
            {
                key: PERSIST_KEY,
                storage: storage,
                whitelist: [],
            },
            reducer,
        ),
});

const persistor = persistStore(store);
// Ensure data is kept in sync across tabs
crosstabSync(store, { key: PERSIST_KEY });

// Set up the app
function Root() {
    return (
        <PersistGate loading={<div>Loading</div>} persistor={persistor}>
            <StoreProvider store={store}>
                <App />
            </StoreProvider>
        </PersistGate>
    );
}

/*
function Root() {
    return (
        <StoreProvider store={store}>
            <App />
        </StoreProvider>
    );
}
*/
ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
