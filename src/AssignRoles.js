import React, { Component } from "react";
//import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
//import SelectField from 'material-ui/SelectField';
import {
    Paper,
    List,
    ListItem,
    TextField,
    Typography,
    ListItemText,
    LinearProgress,
    Snackbar,
    Chip,
    Input,
    Avatar,
    Tooltip,
    Toolbar,
    BottomNavigation,
    BottomNavigationAction,
    Button
} from "@material-ui/core";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import { TermItem } from "./Components.js";
import { AutocompleteSelect } from "./AutocompleteSelect.js";
import HotTable from "react-handsontable";

// fake data generator
const getItems = count =>
    Array.from({ length: count }, (v, k) => k).map(k => ({
        id: `item-${k}`,
        content: `item ${k}`
    }));

// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
};

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
                            display: "inline-block",
                            ...getListStyle(droppableSnapshot.isDraggingOver)
                        }}
                    >
                        <div>TA List</div>
                        {tas.map((ta, index) => {
                            const taInfo = tasInfo[ta] || { id: ta };
                            const highlight = highlightTas[ta];
                            return (
                                <Draggable
                                    key={taInfo.id}
                                    draggableId={taInfo.id + "-" + "ta"}
                                    index={index}
                                >
                                    {(draggableProvided, draggableSnapshot) => (
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
                                                draggableProvided.draggableProps
                                                    .style
                                            )}
                                        />
                                    )}
                                </Draggable>
                            );
                        })}
                        {droppableProvided.placeholder}
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
        const hoursFilled =
            taInfo.assignedHours > taInfo.maxHours
                ? "hours-over"
                : taInfo.assignedHours < taInfo.minHours
                    ? "hours-under"
                    : "hours-match";
        const highlightClass = highlight ? "highlight" : "";
        const chipInner = (
            <div>
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
            </div>
        );
        return (
            <div ref={innerRef} {...props}>
                <Tooltip enterDelay={1000} title={tooltip}>
                    <Chip
                        className={
                            "ta-chip " + hoursFilled + " " + highlightClass
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

        const header = (
            <div className="course-name-container">
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
            currTab: 0
        };

        this.tables = {
            tas: JSON.parse(window.localStorage.getItem("tables.tas")) || [[]],
            courses: JSON.parse(
                window.localStorage.getItem("tables.courses")
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
        const courses = state.courses;
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

    getDroppablePositions(ta = null, allowPos = -1) {
        // get an array of which columns the specified TA may be dropped on.
        const courses = this.state.courses;
        const assignments = this.state.assignments;

        if (ta != null) {
            ta = this.lookupTa(ta);
        }
        return courses.map((course, index) => {
            return assignments[course].indexOf(ta) === -1 || index === allowPos;
        });
    }

    onDragStart = result => {
        const courses = this.state.courses;

        let [taId, _] = result.draggableId.split("-");
        let ta = this.lookupTa(taId);
        let sourcePos = courses.indexOf(result.source.droppableId);

        let droppablePositions = this.getDroppablePositions(ta, sourcePos);

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
        console.log(value);
    };

    // Normally you would want to split things out into separate components.
    // But in this example everything is just done in one place for simplicity
    render() {
        const selectedCourses = this.state.selectedCourses;
        const selectedTAs = this.getTAsInSelectedCourses();
        const courses = this.state.courses;
        const assignments = this.state.assignments;
        const coursesInfo = this.state.coursesInfo;
        // compute this property dynamically
        const tasInfo = this.annotateTaInfo(this.state, assignments);
        const tas = this.state.tas;
        const droppablePositions = this.state.droppablePositions;

        return (
            <div>
                <Toolbar variant="dense">
                    <BottomNavigation
                        value={this.currTab}
                        onChange={this.changeTab}
                        showLabels
                    >
                        <BottomNavigationAction label="Recents" />
                        <BottomNavigationAction label="Nearby" />
                    </BottomNavigation>
                    <Typography variant="title" color="inherit">
                        Photos
                    </Typography>
                </Toolbar>
                <div className={"ta-list-container"}>
                    <DragDropContext
                        onDragEnd={this.onDragEnd}
                        onDragStart={this.onDragStart}
                    >
                        <TAList
                            tas={tas}
                            tasInfo={tasInfo}
                            highlightTas={selectedTAs}
                        />
                        <div className={"ta-rows-container"}>
                            {courses.map((course, index) => {
                                return (
                                    <TAAssignmentList
                                        selected={selectedCourses[course]}
                                        toggleSelect={() => {
                                            this.toggleSelect(course);
                                        }}
                                        key={index}
                                        course={course}
                                        courseInfo={coursesInfo[course]}
                                        tas={assignments[course]}
                                        tasInfo={tasInfo}
                                        isDropDisabled={
                                            !droppablePositions[index]
                                        }
                                        className={
                                            "droppable-" +
                                            !!droppablePositions[index]
                                        }
                                        onDelete={this.onDeleteTA}
                                    />
                                );
                            })}
                        </div>
                    </DragDropContext>
                </div>
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
                        height={200}
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
                        colHeaders={["Course", "Spots", "Hours/Spot"].concat(
                            [...Array(60).keys()].map(k => "TA " + (k + 1))
                        )}
                        rowHeaders={true}
                        height={200}
                        onAfterChange={this.coursesTableChanged}
                        minSpareRows={1}
                        minSpareCols={1}
                        minCols={4}
                    />
                </div>
            </div>
        );
    }
}

export { AssignRoles };
