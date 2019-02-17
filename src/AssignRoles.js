import React, { Component } from "react";
//import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
//import SelectField from 'material-ui/SelectField';
import {
    Chip,
    Avatar,
    Tooltip,
    BottomNavigation,
    BottomNavigationAction,
    Button
} from "@material-ui/core";
import { ViewList, TouchApp } from "@material-ui/icons";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import SplitPane from "react-split-pane";

import HotTable from "react-handsontable";
import Handsontable from "handsontable";


// some tools for fuzzy matching

// Find `course` in `list` doing a fuzzy search
const fuzzyCourseFind = (course, list) => {
    let hash = {}, initHash = {};
    let shortCourse = course.replace(/\s+/g, "");
    for (let i=0; i < list.length; i++) {
        let name = list[i];
        hash[name] = i;
        name = name.replace(/\s+/g, "");
        hash[name] = i
        initHash[name.slice(0,6)] = i
    }
    if (hash[shortCourse] != null) {
        return [list[hash[shortCourse]], hash[shortCourse]];
    }
    if (initHash[shortCourse.slice(0,6)] != null) {
        console.warn("Matching", course, "and", list[initHash[shortCourse.slice(0,6)]]);
        return [list[initHash[shortCourse.slice(0,6)]], initHash[shortCourse.slice(0,6)]]
    }
    const rep_table = {
        "VIC MAC F": "VIC F",
        "VIC MAC S": "VIC S",
        "TRN MAC F": "TRN F",
        "TRN MAC S": "TRN S",
        "PG MAC F": "PG F",
        "PG MAC S": "PG S",
        "NC MAC F": "NC F",
        "NC MAC S": "NC S",
    }

    if (list.indexOf(rep_table[course]) >= 0) {
        let i = list.indexOf(rep_table[course]);
        return [list[i], i];
    }

    return [null, null];
}

// return the fall and spring hours breakdown for a particular
// course. If needsTraining==true, a total of 4 hours is subtracted
// from the F offerings, if possible.
const splitFSHours = (course, coursesInfo, ta, tasInfo, needsTraining=false) => {
    let deduction = 0;
    if (needsTraining) {
        const deductions = {
            1: [-4], 2: [-2, -2], 3: [-2, -1, -1], 4: [-1, -1, -1, -1], 5: [-1, -1, -1, -1, 0], 6: [-1, -1, -1, -1, 0, 0]
        }
        // create a canonicalized list of fall courses the TA is in.
        let currCourses = tasInfo[ta].assigned;
        currCourses = currCourses.filter( c => c.endsWith("F") || c.endsWith("Y") );
        if (currCourses.length == 0 && tasInfo[ta].assigned.length > 0) {
            // if there are no F or Y courses, we have to use S courses
            currCourses = tasInfo[ta].assigned
        }
        if (currCourses.indexOf(course) > -1) {
            deduction = deductions[currCourses.length][currCourses.indexOf(course)];
        }
        //console.log(course, ta, tasInfo[ta], currCourses)
    }

    let ret = {fhours: 0, shours: 0, deduction};
    if (course.endsWith("F")) {
        ret.fhours = (+coursesInfo[course].hoursPerAssignment) + deduction;
    } else if (course.endsWith("S")) {
        ret.shours = (+coursesInfo[course].hoursPerAssignment) + deduction;
    } else if (course.endsWith("Y")) {
        ret.shours = (+coursesInfo[course].hoursPerAssignment)/2;
        ret.fhours = (+coursesInfo[course].hoursPerAssignment)/2 + deduction;
    }
    return ret
}




const grid = 2;

const getItemStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: "none",
    padding: grid * 2,
    margin: `0 0 ${grid}px 0`,

    // change background colour if dragging
    //background: isDragging ? 'lightgreen' : 'red',

    // styles we need to apply on draggables
    ...draggableStyle
});

const getListStyle = isDraggingOver => ({
    //background: isDraggingOver ? "lightblue" : "grey",
    padding: grid * 3,
    minWidth: 110
});

class TAList extends Component {
    render() {
        const { tas, tasInfo, highlightTas } = this.props;
        return (
            <Droppable droppableId="talist" isDropDisabled={true}>
                {(droppableProvided, droppableSnapshot) => (
                    <div
                        ref={droppableProvided.innerRef}
                        style={{
                            display: "flex",
                            width: "100%",
                            flexDirection: "column",
                            ...getListStyle(droppableSnapshot.isDraggingOver)
                        }}
                    >
                        <div>TA List</div>
                        <div className={"ta-list"}>
                            <div className={"scroll-hack"}>
                                {tas.map((ta, index) => {
                                    const taInfo = tasInfo[ta] || { id: ta };
                                    const highlight = highlightTas[ta];
                                    return (
                                        <Draggable
                                            key={taInfo.id}
                                            draggableId={taInfo.id + "-ta"}
                                            index={index}
                                        >
                                            {(
                                                draggableProvided,
                                                draggableSnapshot
                                            ) => (
                                                <TA
                                                    ta={ta}
                                                    taInfo={taInfo}
                                                    innerRef={
                                                        draggableProvided.innerRef
                                                    }
                                                    highlight={highlight}
                                                    {...draggableProvided.draggableProps}
                                                    {...draggableProvided.dragHandleProps}
                                                    style={getItemStyle(
                                                        draggableSnapshot.isDragging,
                                                        draggableProvided
                                                            .draggableProps
                                                            .style
                                                    )}
                                                    className={"ta-draggable"}
                                                />
                                            )}
                                        </Draggable>
                                    );
                                })}
                                {droppableProvided.placeholder}
                            </div>
                        </div>
                    </div>
                )}
            </Droppable>
        );
    }
}

class TA extends Component {
    render() {
        const {
            ta,
            taInfo,
            onDelete,
            course,
            innerRef,
            highlight,
            ...props
        } = this.props;

        // default, assume the hours are under. e.g., if
        // assignedHours is null.
        let hoursFilled = "hours-under";
        if (taInfo.assignedHours > taInfo.maxHours) {
            hoursFilled = "hours-over";
        }
        if (
            taInfo.assignedHours <= taInfo.maxHours &&
            taInfo.assignedHours >= taInfo.minHours
        ) {
            hoursFilled = "hours-match";
        }

        let highlightClass = "";
        if (highlight === 1) {
            highlightClass += " highlight-1";
        } else if (highlight === 2) {
            highlightClass += " highlight-2";
        } else if (highlight) {
            highlightClass += " highlight";
        }

        const chipInner = (
            <div className={"ta-chip-inner"}>
                <div>
                    {taInfo.name} ({taInfo.id})
                </div>
                <div>
                    {taInfo.assignedHours} / {taInfo.minHours}-{taInfo.maxHours}
                </div>
            </div>
        );
        const avatar = taInfo.annotation ? (
            <Avatar className="ta-annotation">{taInfo.annotation}</Avatar>
        ) : (
            undefined
        );
        const tooltip = (
            <div>
                <div>
                    {taInfo.name} UTORid: {taInfo.id}
                </div>
                <div>
                    Assigned: {taInfo.assignedHours} Min: {taInfo.minHours} Max:{" "}
                    {taInfo.maxHours}
                </div>
                <div>Assignment: [{(taInfo.assigned || []).join(", ")}] </div>
                {taInfo.preferenceH && (
                    <div>Preference (High): {taInfo.preferenceH} </div>
                )}
                {taInfo.preferenceM && (
                    <div>Preference (Med): {taInfo.preferenceM} </div>
                )}
            </div>
        );
        return (
            <div ref={innerRef} {...props}>
                <Tooltip enterDelay={1000} title={tooltip}>
                    <Chip
                        className={
                            "ta-chip ta-chip-2 " +
                            hoursFilled +
                            " " +
                            highlightClass
                        }
                        label={chipInner}
                        onDelete={
                            onDelete &&
                            (() => {
                                onDelete(course, ta);
                            })
                        }
                        avatar={avatar}
                    />
                </Tooltip>
            </div>
        );
    }
}

class TAAssignmentList extends Component {
    render() {
        let {
            course,
            courseInfo,
            tas,
            tasInfo,
            onDelete,
            selected,
            toggleSelect,
            ...otherProps
        } = this.props;
        courseInfo = courseInfo || { openings: "?", hoursPerAssignment: "?" };

        let highlighClass = "";
        if (tas.length == courseInfo.openings) {
            highlighClass += " hours-match";
        } else if (tas.length > courseInfo.openings) {
            highlighClass += " hours-over";
        }

        const header = (
            <div className={"course-name-container" + highlighClass}>
                <Button
                    color={selected ? "secondary" : "primary"}
                    onClick={toggleSelect}
                >
                    <div style={{ display: "block" }}>
                        <div>{course}</div>
                        <div className="stats-container">
                            <span className="sub">Hours:</span>
                            {courseInfo.hoursPerAssignment}
                            <span className="sub">Filled:</span>
                            {tas.length}/{courseInfo.openings}
                        </div>
                    </div>
                </Button>
            </div>
        );

        const taList = tas.map((ta, index) => {
            const taInfo = tasInfo[ta] || { id: ta };
            return (
                <Draggable
                    key={course + taInfo.id}
                    draggableId={taInfo.id + "-" + course}
                    index={index}
                >
                    {(draggableProvided, draggableSnapshot) => (
                        <TA
                            ta={ta}
                            taInfo={taInfo}
                            innerRef={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                            {...draggableProvided.dragHandleProps}
                            style={getItemStyle(
                                draggableSnapshot.isDragging,
                                draggableProvided.draggableProps.style
                            )}
                            onDelete={onDelete}
                            course={course}
                        />
                    )}
                </Draggable>
            );
        });
        return (
            <Droppable
                droppableId={course}
                {...otherProps}
                direction="horizontal"
            >
                {(droppableProvided, droppableSnapshot) => (
                    <div className={"ta-row-container"}>
                        {header}
                        <div
                            ref={droppableProvided.innerRef}
                            style={{
                                ...getListStyle(
                                    droppableSnapshot.isDraggingOver
                                )
                            }}
                            className={"ta-row-tas " + otherProps.className}
                        >
                            {taList}
                            {droppableProvided.placeholder}
                        </div>
                    </div>
                )}
            </Droppable>
        );
    }
}

class AssignRoles extends Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            tas: [],
            tasInfo: {},
            courses: [],
            coursesInfo: {},
            assignments: {},
            droppablePositions: [],
            selectedCourses: {},
            currTab: "table"
        };

        this.tables = {
            tas: JSON.parse(window.localStorage.getItem("tables.tas")) || [[]],
            courses: JSON.parse(
                window.localStorage.getItem("tables.courses")
            ) || [[]],
            formattedAssignment: JSON.parse(
                window.localStorage.getItem("tables.formattedAssignment")
            ) || [[]],
            firstTimeTas: JSON.parse(
                window.localStorage.getItem("tables.firstTimeTas")
            ) || [[]]
        };

        let taState = {},
            coursesState = {};
        try {
            taState = this.taInfoFromTable(this.tables.tas);
        } catch (e) {
            // corrupted tas table; replace it with blank data
            console.warn("tas data corrupted", this.tables.tas);
            this.tables.tas = [[]];
        }
        try {
            coursesState = this.coursesTableToState(this.tables.courses);
        } catch (e) {
            // corrupted courses data; replace it with blank data
            console.warn("courses data corrupted", this.tables.courses);
            this.tables.courses = [[]];
        }

        // update the state based on the data loaded from localStorage
        this.state = { ...this.state, ...taState, ...coursesState };

        this.onDragEnd = this.onDragEnd.bind(this);
        this.updateAssignment = this.updateAssignment.bind(this);
        this.getAssignments = this.getAssignments.bind(this);
        this.getDroppablePositions = this.getDroppablePositions.bind(this);
    }

    lookupTa = taId => {
        const tas = this.state.tas;
        let index = tas.indexOf(taId);
        if (index > -1) {
            return tas[index];
        }

        for (let ta of tas) {
            if (ta.id === taId) {
                return ta;
            }
        }
        console.warn("Could not find TA with id", taId);
    };

    getAssignments(ta) {
        const courses = this.courses;
        const assignments = this.assignments;
        return courses.filter((course, idx) => course in assignments);
    }

    updateAssignment(action = "add", course, ta, pos = null) {
        // copy the old TA list
        let newDat = Array.from(this.state.assignments[course]);
        if (action === "add") {
            // insert the TA
            newDat.splice(pos || 0, 0, ta);
        }
        if (action === "remove") {
            // find the TA if possible
            let idx = newDat.indexOf(ta);
            if (idx >= 0) {
                newDat.splice(idx, 1);
            } else {
                newDat.splice(pos, 1);
            }
        }
        // update the state
        this.setState(prevState => {
            const assignments = { ...prevState.assignments, [course]: newDat };

            // update the table when we update the state
            this.tables.courses.length = 0;
            this.tables.courses.splice(
                0,
                0,
                ...this.coursesStateToTable({ ...prevState, assignments })
            );
            // chaning the courses table causes the displayed data
            // in the spreadsheet to change, but doesn't trigger
            // a change in the spreadsheet. So, save the spreadsheet
            // data manually.
            this.saveTable("courses");

            return {
                assignments
            };
        });
    }

    saveTable = tableName => {
        if (!(tableName in this.tables)) {
            console.warn("Cannot save table named", tableName, "name unknown");
            return;
        }

        window.localStorage.setItem(
            "tables." + tableName,
            JSON.stringify(this.tables[tableName])
        );
    };

    annotateTaInfo = (state, assignments) => {
        // calculate the number of hours assigned to each TA
        // as well as their preferences and current assignment
        state = state || this.state;
        assignments = assignments || state.assignments;
        const tas = state.tas;
        const tasInfo = state.tasInfo;
        const coursesInfo = state.coursesInfo;

        let assigned = {};
        let assignedHours = {};
        for (let course in assignments) {
            for (let ta of assignments[course]) {
                assigned[ta] = assigned[ta] || [];
                assigned[ta].push(course);
                assignedHours[ta] = assignedHours[ta] || 0;
                assignedHours[ta] += +coursesInfo[course].hoursPerAssignment;
            }
        }

        // merge this computed info with existing info
        let newInfo = {};
        for (let ta of tas) {
            newInfo[ta] = {
                ...tasInfo[ta],
                assigned: assigned[ta],
                assignedHours: assignedHours[ta]
            };
        }

        return newInfo;
    };

    getDroppablePositions(
        ta = null,
        allowPos = -1,
        prefs = { preferenceH: [], preferenceM: [] }
    ) {
        // get an array of which columns the specified TA may be dropped on.
        // prefs contain high and medium preferences for courses
        const courses = this.state.courses;
        const assignments = this.state.assignments;

        if (ta != null) {
            ta = this.lookupTa(ta);
        }
        return courses.map((course, index) => {
            let matchLevel = 1;
            // match high preferences
            for (let pref of prefs.preferenceM) {
                if (course.match(pref)) {
                    matchLevel = 2;
                }
            }
            for (let pref of prefs.preferenceH) {
                if (course.match(pref)) {
                    matchLevel = 3;
                }
            }
            //
            return assignments[course].indexOf(ta) === -1 || index === allowPos
                ? matchLevel
                : false;
        });
    }

    onDragStart = result => {
        const courses = this.state.courses;
        const tasInfo = this.state.tasInfo;

        // we need to split on the last "-"
        let split = result.draggableId.split("-");
        if (split.length > 1) {
            split.pop();
        }
        let taId = split.join("-");
        let ta = this.lookupTa(taId);
        let sourcePos = courses.indexOf(result.source.droppableId);

        let taInfo = tasInfo[ta];
        console.log(ta, taInfo, taId);
        let prefs = {
            preferenceH: (taInfo.preferenceH || "")
                .split(",")
                .map(x => x.trim())
                .filter(x => !!x),
            preferenceM: (taInfo.preferenceM || "")
                .split(",")
                .map(x => x.trim())
                .filter(x => !!x)
        };

        let droppablePositions = this.getDroppablePositions(
            ta,
            sourcePos,
            prefs
        );

        this.setState({
            droppablePositions
        });
    };

    onDragEnd(result) {
        // dropped outside the list
        if (!result.destination) {
            return;
        }

        const assignments = this.state.assignments;
        const tas = this.state.tas;

        console.log(result.source, result.destination);

        let destCourse = result.destination.droppableId;
        let sourceCourse = result.source.droppableId;
        let ta = null;
        if (sourceCourse in assignments) {
            ta = assignments[sourceCourse][result.source.index];

            // remove the TA if it was dragged from an assignment
            this.updateAssignment(
                "remove",
                sourceCourse,
                null,
                result.source.index
            );
        } else {
            ta = tas[result.source.index];
        }

        this.updateAssignment("add", destCourse, ta, result.destination.index);
        this.setState({
            droppablePositions: this.getDroppablePositions(null)
        });
    }

    onDeleteTA = (course, ta) => {
        this.updateAssignment("remove", course, ta);
    };

    toggleSelect = course => {
        this.setState(prevState => {
            let courseSelectState = prevState.selectedCourses[course];
            return {
                selectedCourses: {
                    ...prevState.selectedCourses,
                    [course]: !courseSelectState
                }
            };
        });
    };

    getTAsInSelectedCourses = () => {
        const selectedCourses = this.state.selectedCourses;
        const assignments = this.state.assignments;

        let ret = {};
        for (let course in selectedCourses) {
            if (!selectedCourses[course]) {
                continue;
            }
            for (let ta of assignments[course]) {
                ret[ta] = true;
            }
        }
        return ret;
    };

    getTAsPreferringSelectedCourses = () => {
        const selectedCourses = this.state.selectedCourses;
        const tas = this.state.tas;
        const tasInfo = this.state.tasInfo;

        let tasPrefs = {};
        for (let ta of tas) {
            let taInfo = tasInfo[ta];
            tasPrefs[ta] = {
                preferenceH: (taInfo.preferenceH || "")
                    .split(",")
                    .map(x => x.trim())
                    .filter(x => !!x),
                preferenceM: (taInfo.preferenceM || "")
                    .split(",")
                    .map(x => x.trim())
                    .filter(x => !!x)
            };
        }

        let selectedCoursesList = Object.entries(selectedCourses)
            .filter(([a, b]) => b)
            .map(([a, b]) => a);
        let ret = {};
        for (let ta of tas) {
            // figure out if the ta has a preference that is
            // a substring of any of the courses we're wondering about
            let prefs = tasPrefs[ta];
            let inPrefs = selectedCoursesList.map((course, index) => {
                let matchLevel = 0;
                for (let pref of prefs.preferenceM) {
                    if (course.match(pref)) {
                        matchLevel = 1;
                    }
                }
                // match high preferences
                for (let pref of prefs.preferenceH) {
                    if (course.match(pref)) {
                        matchLevel = 2;
                    }
                }
                return matchLevel;
            });
            ret[ta] = Math.max(0, ...inPrefs);
        }
        return ret;
    };

    taTableChanged = (changes, action) => {
        if (
            !this.refs.hot ||
            !this.refs.hot.hotInstance ||
            action === "loadData"
        ) {
            return;
        }
        this.saveTable("tas");
        this.setState(this.taInfoFromTable(this.tables.tas));
    };

    coursesTableChanged = (changes, action) => {
        if (
            !this.refs.hot ||
            !this.refs.hot.hotInstance ||
            action === "loadData"
        ) {
            return;
        }
        this.saveTable("courses");

        let currState = this.coursesStateToTable();
        if (JSON.stringify(this.tables.courses) !== JSON.stringify(currState)) {
            this.setState(this.coursesTableToState(this.tables.courses));
        }
    };
    
    formattedAssignmentTableChanged = (changes, action) => {
        if (
            !this.refs.hot5 ||
            !this.refs.hot5.hotInstance ||
            action === "loadData"
        ) {
            return;
        }
        this.saveTable("formattedAssignment");
    };
    firstTimeTasTableChanged = (changes, action) => {
        if (
            !this.refs.hot6 ||
            !this.refs.hot6.hotInstance ||
            action === "loadData"
        ) {
            return;
        }
        this.saveTable("firstTimeTas");
    };

    createAssignmentsTable = tasInfo => {
        const tas = this.state.tas;
        const coursesInfo = this.state.coursesInfo;
        const courses = this.state.courses;
        const assignments = this.state.assignments;

        // Make the assignments table
        let ret = [];
        for (let ta of tas) {
            let taInfo = tasInfo[ta];
            let newRow = [
                ta,
                taInfo.name,
                taInfo.minHours,
                taInfo.maxHours,
                taInfo.annotation,
                taInfo.assignedHours
            ];
            // compute the F and S hours.
            let fHours = 0,
                sHours = 0;
            for (let course of taInfo.assigned || []) {
                if (course.endsWith("F")) {
                    fHours += +coursesInfo[course].hoursPerAssignment;
                } else if (course.endsWith("S")) {
                    sHours += +coursesInfo[course].hoursPerAssignment;
                } else if (course.endsWith("Y")) {
                    fHours += +coursesInfo[course].hoursPerAssignment / 2;
                    sHours += +coursesInfo[course].hoursPerAssignment / 2;
                }
            }
            newRow.push(fHours);
            newRow.push(sHours);
            newRow = newRow.concat(taInfo.assigned || []);
            ret.push(newRow);
        }
        this.tables.assignment = ret;

        // make the assignments-by-course table
        ret = [];
        for (let course of courses) {
            let courseInfo = coursesInfo[course];
            for (let ta of assignments[course] || []) {
                let taInfo = tasInfo[ta];
                let newRow = [
                    course,
                    ta,
                    taInfo.name,
                    courseInfo.hoursPerAssignment,
                    (taInfo.assigned || []).length,
                    taInfo.assignedHours
                ];
                ret.push(newRow);
            }
        }
        this.tables.assignmentByCourse = ret;

        // this is used in an && statement so that it's only
        // computed when needed. Always return true.
        return true;
    };

    createFormattedAssignmentsTable = tasInfo => {
        const tas = this.state.tas;
        const coursesInfo = this.state.coursesInfo;
        const courses = this.state.courses;
        const assignments = this.state.assignments;

        let firstTimeTas = {};
        for (let row of this.tables.firstTimeTas) {
            if (row[0]) {
                firstTimeTas[row[0]] = true;
            }
        }

        let formattedAssignmentHash = {};
        // make a hash of all the available assignments
        let hash = {};
        for (let [assNum, emp, course, ...rest] of this.tables.formattedAssignment) {
            hash[course] = hash[course] || [];
            hash[course].push(assNum);
        }
        let courseList = Object.keys(hash);
        for (let [course, assignedTas] of Object.entries(assignments)) {
            if ((assignedTas || []).length == 0) {
                continue;
            }
            let [formattedCourse, index] = fuzzyCourseFind(course, courseList);
            if (formattedCourse == null) {
                console.error("Could not find table entry for", course);
                continue;
            }
            for (let i=0; i < assignedTas.length; i++) {
                let ta = assignedTas[i];
                let number = hash[formattedCourse][i];
                if (number == null) {
                    console.error("No posting available for", course, "ta #", i+1);
                }
                formattedAssignmentHash[number] = {
                    id: ta,
                    name: tasInfo[ta].name,
                    ...splitFSHours(course, coursesInfo, ta, tasInfo, firstTimeTas[ta])
                };
            }
        }

        console.log(formattedAssignmentHash)

        let ret = [];
        for (let row of this.tables.formattedAssignment) {
            let [number, employee, courseID, session, fhours, shours, ...rest] = row;
            if (!formattedAssignmentHash[number]) {
                // there is no TA assigned to this position, so leave the row as is
                ret.push(row);
                continue;
            }

            let rowInfo = formattedAssignmentHash[number]
            ret.push([number, rowInfo.name, courseID, session, rowInfo.fhours, rowInfo.shours, ...rest, rowInfo.deduction])
        }
        this.tables.formattedAssignment = ret;

        // this is used in an && statement so that it's only
        // computed when needed. Always return true.
        return true;
    };

    taInfoFromTable = table => {
        let getUniqueName = (used, proposed) => {
            if (proposed in used) {
                let num = 1;
                let orig = proposed;
                proposed = proposed + "-" + num;
                while (proposed in used && num < 1000) {
                    num += 1;
                    proposed = orig + "-" + num;
                }
            }
            return proposed;
        };
        let tas = [];
        let tasInfo = {};
        for (let [
            ta,
            name,
            minHours,
            maxHours,
            annotation,
            preferenceH,
            preferenceM,
            ...rest
        ] of table) {
            if (ta == null || !ta) {
                continue;
            }
            ta = getUniqueName(tasInfo, ta);
            tas.push(ta);
            tasInfo[ta] = {
                id: ta,
                name,
                minHours,
                maxHours,
                assignedHours: 0,
                annotation: (annotation || "").trim(),
                preferenceH,
                preferenceM
            };
        }

        return { tas, tasInfo };
    };

    coursesStateToTable = (state = this.state) => {
        // get data on courses from the state and make a table out of it.
        const courses = state.courses;
        const coursesInfo = state.coursesInfo;
        const assignments = state.assignments;

        let ret = [];
        for (let course of courses) {
            let courseInfo = coursesInfo[course];
            let assignment = assignments[course] || [];
            ret.push([
                course,
                courseInfo.openings,
                courseInfo.hoursPerAssignment,
                ...assignment
            ]);
        }
        return ret;
    };

    coursesTableToState = table => {
        let courses = [],
            coursesInfo = {},
            assignments = {};
        for (let [course, openings, hoursPerAssignment, ...tas] of table) {
            if (course == null || !course) {
                continue;
            }
            courses.push(course);
            coursesInfo[course] = { openings, hoursPerAssignment };
            assignments[course] = tas.filter(x => x != null && x);
        }

        return { courses, coursesInfo, assignments };
    };

    changeTab = (event, value) => {
        this.setState({ currTab: value });
    };

    // Normally you would want to split things out into separate components.
    // But in this example everything is just done in one place for simplicity
    render() {
        const selectedCourses = this.state.selectedCourses;
        //const selectedTAs = this.getTAsInSelectedCourses();
        const selectedTAs = this.getTAsPreferringSelectedCourses();
        const courses = this.state.courses;
        const assignments = this.state.assignments;
        const coursesInfo = this.state.coursesInfo;
        // compute this property dynamically
        const tasInfo = this.annotateTaInfo(this.state, assignments);
        const tas = this.state.tas;
        const droppablePositions = this.state.droppablePositions;
        const currTab = this.state.currTab;

        return (
            <div
                style={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column"
                }}
            >
                <BottomNavigation
                    value={currTab}
                    onChange={this.changeTab}
                    showLabels
                >
                    <BottomNavigationAction
                        value="table"
                        label="Graphical"
                        icon={<TouchApp />}
                    />
                    <BottomNavigationAction
                        value="spreadsheet"
                        label="Spreadsheet"
                        icon={<ViewList />}
                    />
                    <BottomNavigationAction
                        value="details"
                        label="Assignment Breakdown"
                        icon={<ViewList />}
                    />
                    <BottomNavigationAction
                        value="formatted"
                        label="Formatted Breakdown"
                        icon={<ViewList />}
                    />
                </BottomNavigation>
                {currTab === "table" && (
                    <div className={"ta-list-container"}>
                        <DragDropContext
                            onDragEnd={this.onDragEnd}
                            onDragStart={this.onDragStart}
                        >
                            <SplitPane
                                split="vertical"
                                minSize={110}
                                defaultSize={210}
                            >
                                <TAList
                                    tas={tas}
                                    tasInfo={tasInfo}
                                    highlightTas={selectedTAs}
                                />
                                <div className={"ta-rows-container"}>
                                    <div className={"scroll-hack"}>
                                        {courses.map((course, index) => {
                                            return (
                                                <TAAssignmentList
                                                    selected={
                                                        selectedCourses[course]
                                                    }
                                                    toggleSelect={() => {
                                                        this.toggleSelect(
                                                            course
                                                        );
                                                    }}
                                                    key={index}
                                                    course={course}
                                                    courseInfo={
                                                        coursesInfo[course]
                                                    }
                                                    tas={assignments[course]}
                                                    tasInfo={tasInfo}
                                                    isDropDisabled={
                                                        !droppablePositions[
                                                            index
                                                        ]
                                                    }
                                                    className={
                                                        "droppable-" +
                                                        +droppablePositions[
                                                            index
                                                        ]
                                                    }
                                                    onDelete={this.onDeleteTA}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </SplitPane>
                        </DragDropContext>
                    </div>
                )}
                {currTab === "spreadsheet" && (
                    <div>
                        <div>
                            <HotTable
                                root="hot"
                                ref="hot"
                                data={this.tables.tas}
                                colHeaders={[
                                    "UTORid",
                                    "Name",
                                    "Min Assignment",
                                    "Max Assignment",
                                    "Annotation",
                                    "Preference (high)",
                                    "Preference (med)"
                                ]}
                                rowHeaders={true}
                                height={600}
                                onAfterChange={this.taTableChanged}
                                minSpareRows={1}
                                minCols={7}
                            />
                        </div>
                        <div>
                            <HotTable
                                root="hot2"
                                ref="hot2"
                                data={this.tables.courses}
                                colHeaders={[
                                    "Course",
                                    "Spots",
                                    "Hours/Spot"
                                ].concat(
                                    [...Array(60).keys()].map(
                                        k => "TA " + (k + 1)
                                    )
                                )}
                                rowHeaders={true}
                                height={600}
                                onAfterChange={this.coursesTableChanged}
                                minSpareRows={1}
                                minSpareCols={1}
                                minCols={43}
                            />
                        </div>
                    </div>
                )}
                {currTab === "details" &&
                    this.createAssignmentsTable(tasInfo) && (
                        <div>
                            <div>
                                <HotTable
                                    root="hot3"
                                    ref="hot3"
                                    data={this.tables.assignment}
                                    colHeaders={[
                                        "UTORid",
                                        "Name",
                                        "Request Min",
                                        "Request Max",
                                        "Annotation",
                                        "Given",
                                        "Given F",
                                        "Given S"
                                    ].concat(
                                        [...Array(7).keys()].map(
                                            k => "Assignment " + (k + 1)
                                        )
                                    )}
                                    columns={[...Array(15).keys()].map(k => {
                                        return { readOnly: true };
                                    })}
                                    rowHeaders={true}
                                    height={600}
                                    minSpareRows={1}
                                    minCols={15}
                                    cells={function(row, col) {
                                        let cellProperties = {};
                                        if (col === 6 || col === 7) {
                                            let data = this.instance.getDataAtRow(
                                                row
                                            );
                                            // determine if there is a big imbalance between fall and spring
                                            if (
                                                Math.abs(data[6] - data[7]) > 30
                                            ) {
                                                cellProperties.renderer = function(
                                                    instance,
                                                    td,
                                                    row,
                                                    col,
                                                    prop,
                                                    value,
                                                    cellProperties
                                                ) {
                                                    Handsontable.renderers.TextRenderer.apply(
                                                        this,
                                                        arguments
                                                    );
                                                    td.className +=
                                                        " imbalanced-assignment";
                                                };
                                            }
                                        }
                                        return cellProperties;
                                    }}
                                />
                            </div>
                            <div>
                                <HotTable
                                    root="hot4"
                                    ref="hot4"
                                    data={this.tables.assignmentByCourse}
                                    colHeaders={[
                                        "Course",
                                        "UTORid",
                                        "Name",
                                        "Hours",
                                        "All Assignments",
                                        "All Hours"
                                    ]}
                                    columns={[...Array(15).keys()].map(k => {
                                        return { readOnly: true };
                                    })}
                                    rowHeaders={true}
                                    height={600}
                                    minSpareRows={1}
                                    minCols={6}
                                />
                            </div>
                        </div>
                    )}
                {currTab === "formatted" &&
                    this.createFormattedAssignmentsTable(tasInfo) && (
                        <div>
                            <div>
                                <HotTable
                                    root="hot6"
                                    ref="hot6"
                                    data={this.tables.firstTimeTas}
                                    onAfterChange={this.firstTimeTasTableChanged}
                                    colHeaders={["First Time TAs"]}
                                    rowHeaders={true}
                                    height={600}
                                    minSpareRows={1}
                                    minSpareCols={1}
                                />
                            </div>
                            <div>
                                <HotTable
                                    root="hot5"
                                    ref="hot5"
                                    data={this.tables.formattedAssignment}
                                    colHeaders={[
                                        "Assignment Number",
                                        "EmployeeID",
                                        "Course",
                                        "Session",
                                        "F-Hours",
                                        "S-Hours",
                                        "Smr-Hours",
                                        "Description",
                                        "OTO",
                                        "Date Offered",
                                        "Accepted",
                                        "Assignment Date",
                                        "Date Printed",
                                        "Year",
                                        "FallMonth",
                                        "WinterMonth",
                                        "Training Deduction"
                                    ]}
                                    columns={[...Array(17).keys()].map(k => {
                                        // The "EmployeeID" column is dynamically computed
                                        if (k==1) {return { readOnly: true }};
                                        return {readOnly: false};
                                    })}
                                    onAfterChange={this.formattedAssignmentTableChanged}
                                    rowHeaders={true}
                                    height={600}
                                    minSpareRows={1}
                                    minCols={16}
                                />
                            </div>
                        </div>
                    )}
            </div>
        );
    }
}

export { AssignRoles };
