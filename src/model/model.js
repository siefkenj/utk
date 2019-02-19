/*
 * data model and update functions for all persistent state
 */
import deepmerge from "deepmerge";

const dataModel = {
    currentTerm: null
}

const updateFunctions = {
    setCurrentTerm: (state, payload) => {
        state.currentTerm = payload;
    }
}

const model = deepmerge.all([dataModel, updateFunctions]);
export { model }