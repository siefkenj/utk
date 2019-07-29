/*
 * data model and update functions for all persistent state
 */
import deepmerge from "deepmerge";
import { action, computed } from "easy-peasy";

/**
 * Escape a string for use with JavaScript's `.match` function. By default
 * `.match` interprets any input as a regular expression.
 *
 * from https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
 * @param {string} string
 * @returns
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

/**
 * Find `course` in `list` doing a fuzzy search.
 *
 * @param {string} course
 * @param {string[]} list
 * @returns {string | null} Course in `list` that matches `course`
 */
const fuzzyCourseFind = (course, list) => {
    course = course.replace(/\s+/g, "").toLocaleLowerCase();
    const normalizedList = list.map((x, i) => [
        escapeRegExp(x.replace(/\s+/g, "").toLocaleLowerCase()),
        i
    ]);
    for (const [c, i] of normalizedList) {
        if (course.match(c)) {
            return list[i];
        }
    }
    return null;
};

/**
 * Returns a unique string key for `session`
 *
 * @param {Session} session
 * @returns {string}
 */
function sessionToStr(session) {
    session = session || {};
    return `${session.year}${session.term}`;
}

/**
 * Sums an array of numbers
 *
 * @param {number[]} [array=[]]
 * @returns {number}
 */
function sum(array = []) {
    return array.reduce((a, b) => +a + +b, 0);
}

/**
 * Create an object that contains the properties that
 * `newObj` that differ from `oldOjb`. Only keys in `modelObject`
 * are checked and items are cast to be the same type as the corresponding
 * properties in `modelObject`
 *
 * @param {object} oldObj
 * @param {object} newObj
 * @param {object} modelObject
 * @returns {object}
 */
function objectDiff(oldObj, newObj, modelObject) {
    /**
     * Make sure the type of `val` matches the type found in `typeInfo[prop]`
     *
     * @param {string} prop
     * @param {any} val
     * @returns {any} `val` cast as the appropriate type
     */
    function ensureType(prop, val) {
        if (!modelObject) {
            return val;
        }
        if (typeof modelObject[prop] === "number") {
            return +val;
        }
        return val;
    }

    const ret = {};
    for (const prop in modelObject) {
        if (ensureType(prop, oldObj[prop]) !== ensureType(prop, newObj[prop])) {
            ret[prop] = ensureType(prop, newObj[prop]);
        }
    }
    return ret;
}

/**
 * Create a cannonicalized UTORid from a ta object.
 *
 * @param {{utorid: string, first: string, last:string, email: string}} ta
 * @returns {string}
 */
function genUTORid(ta) {
    return ta.utorid || ta.email || ta.last + "." + ta.fist;
}

/**
 * Reducer for updating a single TA assignment passed into `payload`
 *
 * @param {*} state
 * @param {*} payload
 * @returns
 */
function updateSingleAssignment(state, payload) {
    // (course,ta) pairs uniquely determine an assignment and a ta is uniquely
    // determined by a utorid
    const { course, ta, omitHistory, message } = payload;
    // the TA could be a ta object or a string of just the utorid
    const utorid = (ta || {}).utorid || ta;
    const key = [course, utorid];

    let assignment =
        state._assignments[key] || deepmerge(DEFAULT_ASSIGNMENT, {});
    // The assignment update might be changing the course as well
    // as the hours. If so, there will be a `replaceAssiment` attribute.
    if (payload.replaceAssignment && payload.replaceAssignment.course) {
        const oldKey = [
            payload.replaceAssignment.course,
            payload.replaceAssignment.ta
        ];
        // If there is an old assignment and a new assignment, that is trouble
        if (
            state._assignments[key] &&
            state._assignments[oldKey] &&
            `${key}` !== `${oldKey}`
        ) {
            console.warn(
                "Conflict when updating assignment between",
                state._assignments[oldKey],
                state._assignments[key],
                "Both assignments already exist"
            );
            return;
        }
        // If we're here, we're changing courses and hours. In this case,
        // we will delete the old assignment since a new one will be created
        if (state._assignments[oldKey]) {
            assignment = state._assignments[oldKey];
            delete state._assignments[oldKey];
        }
    }
    // before we take a diff, make sure that `ta` has been normalized
    // to the utorid
    assignment.ta = utorid;
    const newAssignment = {
        ...assignment,
        deleted: false,
        ...payload,
        ta: utorid
    };
    if (!omitHistory) {
        const diff = objectDiff(assignment, newAssignment, DEFAULT_ASSIGNMENT);
        if (Object.keys(diff).length > 0) {
            newAssignment.history = newAssignment.history || [];
            newAssignment.history.push({
                ...diff,
                _message: message,
                _date: new Date().toISOString()
            });
        }
    }
    state._assignments[key] = newAssignment;
}

/**
 * Reducer for updating a single TA
 *
 * @param {*} state
 * @param {*} payload
 * @returns
 */
function updateSingleTA(state, payload) {
    const { delete: deleteAction } = payload;
    // make a UTORid out of the utorid || email || name
    const utorid = genUTORid(payload);
    // create a TA if there wasn't one before
    state._TAs[utorid] = state._TAs[utorid] || {
        ...deepmerge(DEFAULT_TA, {}),
        utorid
    };
    state._TAs[utorid].utorid = utorid;
    if (deleteAction) {
        delete state._TAs[utorid];
        return;
    }
    state._TAs[utorid] = { ...state._TAs[utorid], ...payload };
}

const DEFAULT_COURSE = {
    course: "DEFAULT COURSE",
    hours: 0,
    defaultAssignment: 0
};
const DEFAULT_TA = {
    utorid: "",
    first: "",
    last: "",
    email: "",
    id: "",
    minHours: 0,
    maxHours: 1,
    preferenceH: [],
    preferenceM: [],
    annotation: "",
    firstTime: false
};
const DEFAULT_ASSIGNMENT = {
    course: "",
    ta: "<utorid>",
    hours: 0,
    rejected: false,
    deleted: false
};

// The actual data that is stored. This data is not accessed directly
const dataModel = {
    _courses: {},
    _assignments: {}, // indexed by [course,utorid]
    _TAs: {}
};

const otherState = {
    _currentSession: null,
    _selectedTA: null,
    _selectedCourses: {},
    _modelDataBySession: {}
};

// Computed view of the model. Components access these properties
const modelView = {
    /**
     * Get all state for saving/restoring. This only returns true state,
     * and does not include any computed properties.
     */
    allState: computed(state => {
        const ret = {};
        for (const prop in dataModel) {
            ret[prop] = state[prop];
        }
        return ret;
    }),
    currentSession: computed(state => state._currentSession),
    courses: computed(state => {
        // `hoursAssigned` and `numAssigned` are automatically
        // computed when getting a list of courses
        const assignments = state.assignments;
        function computeStats(course) {
            return {
                hoursAssigned: sum(assignments[course].map(x => +x.hours)),
                numAssigned: assignments[course].length
            };
        }

        // We need to set the highlight level, which depends on the
        // current TA that is selected
        const highlights = {
            M: (state._selectedTA || {}).preferenceM || [],
            H: (state._selectedTA || {}).preferenceH || []
        };
        function computeHighlight(course) {
            const ret = {};
            for (const [level, preferences] of Object.entries(highlights)) {
                if (fuzzyCourseFind(course, preferences)) {
                    ret[level] = true;
                }
            }
            return ret;
        }

        // Compute whether or not we should be droppable based on the selected TA
        function computeDroppable(course) {
            if (
                state._selectedTA &&
                state._assignments[`${course},${state._selectedTA.utorid}`]
            ) {
                // If we're here, we're in the assignments hash, but we could be
                // deleted or rejected. So, check the computed `.assignments` prop
                // to see if we're there
                if (
                    state.assignments[course].some(
                        x => x.ta.utorid === state._selectedTA.utorid
                    )
                ) {
                    return { isNotDroppable: true };
                }
            }
            return {};
        }

        function computeToggled(course) {
            return { isSelected: state._selectedCourses[course] };
        }

        const ret = {};
        for (const course in state._courses) {
            ret[course] = {
                ...state._courses[course],
                ...computeStats(course),
                ...computeHighlight(course),
                ...computeDroppable(course),
                ...computeToggled(course)
            };
        }
        return ret;
    }),
    TAs: computed(state => {
        const ret = [];
        for (const utorid in state._TAs) {
            const TA = state._TAs[utorid];
            const TAsAssignments = Object.values(state._assignments).filter(
                x => x.ta === utorid && !x.rejected && !x.deleted
            );
            TA.assigned = TAsAssignments.map(x => x.course);
            TA.assignedHours = sum(TAsAssignments.map(x => x.hours));
            // What is stored in the TA data might be empty. In this case
            // we want to use the key as the utorid
            TA.utorid = TA.utorid || utorid;
            // check to see if any of our prefferred courses are selected
            // and set highlight tags appropriately
            TA.H =
                Object.entries(state._selectedCourses).some(
                    ([course, selected]) =>
                        selected && fuzzyCourseFind(course, TA.preferenceH)
                ) || undefined;
            TA.M =
                Object.entries(state._selectedCourses).some(
                    ([course, selected]) =>
                        selected && fuzzyCourseFind(course, TA.preferenceM)
                ) || undefined;

            ret.push(TA);
        }
        return ret;
        //Object.values(state._TAs)
    }),
    assignments: computed(state => {
        // return an object indexed by courses containing all the assignments
        const ret = {};
        for (const assignment of Object.values(state._assignments)) {
            // rejected assignments don't show up in this list
            if (assignment.rejected || assignment.deleted) {
                continue;
            }
            ret[assignment.course] = ret[assignment.course] || [];
            ret[assignment.course].push({
                ...assignment,
                // If the TA with utorid `assignment.ta` has been deleted,
                // create a "fake" ta with the same utorid. This will allow
                // the invalid assignment to be deleted in the UI
                ta: state._TAs[assignment.ta] || { utorid: assignment.ta }
            });
        }
        for (const course in state._courses) {
            ret[course] = ret[course] || [];
        }
        return ret;
    })
};

const updateFunctions = {
    /**
     * restores all state passed in to `payload`; Unsupplied values
     * are replaced with defaults from `dataModel`
     */
    restoreAllState: action((state, payload) => {
        for (const prop in dataModel) {
            state[prop] = payload[prop] || dataModel[prop];
        }
    }),
    setCurrentSession: action((state, payload) => {
        const prevSessionKey = sessionToStr(state._currentSession);
        state._currentSession = payload;
        const newSessionKey = sessionToStr(state._currentSession);

        // Save/restore data for the session that was changed
        // Save
        for (const prop in dataModel) {
            state._modelDataBySession[prevSessionKey] =
                state._modelDataBySession[prevSessionKey] || {};
            state._modelDataBySession[prevSessionKey][prop] = state[prop];
        }
        // Restore
        for (const prop in dataModel) {
            state[prop] =
                (state._modelDataBySession[newSessionKey] || {})[prop] ||
                dataModel[prop];
        }
    }),
    setSelectedTA: action((state, payload) => {
        if (!payload) {
            state._selectedTA = null;
            return;
        }
        const utorid = payload.utorid || payload;
        state._selectedTA = state._TAs[utorid];
    }),
    toggleSelectedCourse: action((state, payload) => {
        state._selectedCourses[payload] = !state._selectedCourses[payload];
    }),
    updateCourse: action((state, payload) => {
        const {
            omitHistory,
            message,
            delete: deleteAction,
            ...newProps
        } = payload;
        const courseCode = newProps.course;

        // Delete the course if the delete action was specified
        if (deleteAction) {
            if (!state._courses[courseCode]) {
                console.warn(
                    "Trying to delete",
                    payload,
                    "but the course doesn't exist."
                );
            }
            delete state._courses[courseCode];
            return;
        }

        // Get the old course and the updated course so we can do a diff
        // for history
        const course =
            state._courses[courseCode] || deepmerge(DEFAULT_COURSE, {});
        const newCourse = { ...course, ...newProps };

        // create a history if needed
        if (!omitHistory) {
            const diff = objectDiff(course, newCourse, DEFAULT_COURSE);
            if (Object.keys(diff).length > 0) {
                newCourse.history = newCourse.history || [];
                newCourse.history.push({
                    ...diff,
                    _message: message,
                    _date: new Date().toISOString()
                });
            }
        }
        state._courses[courseCode] = newCourse;
    }),
    updateTA: action(updateSingleTA),
    updateTAs: action((state, payload) => {
        for (const ta of payload) {
            updateSingleTA(state, ta);
        }
    }),
    updateAssignment: action(updateSingleAssignment)
};

const model = deepmerge.all([
    otherState,
    dataModel,
    modelView,
    updateFunctions
]);
// make a duplicate of the model for testing
model.test = { ...model };
//console.log("modle", model)
export { model };
