import React from "react";
import { useProp } from "../libs/hooks";
//import classNames from "classnames";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import {
    Button,
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
    TextField,
    Table,
    TableBody,
    TableRow,
    TableCell,
    TableHead
} from "@material-ui/core";
import PropTypes from "prop-types";
import IconButton from "@material-ui/core/IconButton";
import EditIcon from "@material-ui/icons/Edit";

import "../css/course-table.css";
import { TAItem, TAList } from "./ta-display";
import SplitPane from "react-split-pane";

function CourseDetailsDialog(props) {
    const { courseDetails, onSave, onCancel, ...rest } = props;
    const [hours, setHours] = useProp(courseDetails.hours, !rest.open);
    const [defaultAssignment, setDefaultAssignment] = useProp(
        courseDetails.defaultAssignment,
        !rest.open
    );
    const [message, setMessage] = React.useState("");

    function onSaveClick() {
        const newState = {
            ...courseDetails,
            hours,
            defaultAssignment,
            message
        };
        onSave(newState);
    }

    const caption = {
        hours: "Total Hours",
        defaultAssignment: "Default Assignment"
    };
    // Assemble rows of history for the history table
    const history = [...(courseDetails.history || [])].reverse().map(item => {
        const whatChanged = Object.keys(caption).filter(k => item[k] != null);
        return (
            <TableRow key={item._date}>
                <TableCell>
                    {whatChanged.map(k => (
                        <div key={k}>
                            {caption[k]} → {item[k]}
                        </div>
                    ))}
                </TableCell>
                <TableCell>{item._message}</TableCell>
                <TableCell>
                    {new Date(item._date).toLocaleDateString("en-CA", {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                    })}
                </TableCell>
            </TableRow>
        );
    });
    return (
        <Dialog {...rest}>
            <DialogTitle>{courseDetails.course}</DialogTitle>
            <DialogContent>
                <TextField
                    label="Total Hours"
                    value={hours}
                    onChange={e => setHours(e.target.value)}
                />
                <TextField
                    label="Default Assignment"
                    value={defaultAssignment}
                    onChange={e => setDefaultAssignment(e.target.value)}
                />
                <TextField
                    label="Reason for change"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                />
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell component="th" scope="row">
                                Total Assignments
                            </TableCell>
                            <TableCell>{courseDetails.numAssigned}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell component="th" scope="row">
                                Hours Remaining
                            </TableCell>
                            <TableCell>
                                {hours - courseDetails.hoursAssigned}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                <DialogTitle>History</DialogTitle>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Changed</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Date</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>{history}</TableBody>
                </Table>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>Cancel</Button>
                <Button onClick={onSaveClick}>Save</Button>
            </DialogActions>
        </Dialog>
    );
}

function CourseHeaderButton(props) {
    const { courseDetails, onClick = () => {}, onChange, ...rest } = props;
    const {
        course,
        hours,
        defaultAssignment,
        hoursAssigned,
        numAssigned,
        isSelected
    } = courseDetails;
    const remainingAssignments = (hours - hoursAssigned) / defaultAssignment;
    const [dialogOpen, setDialogOpen] = React.useState(false);

    function onSave(courseDetails) {
        if (onChange) {
            onChange(courseDetails);
        }
        setDialogOpen(false);
    }

    const buttonColor = isSelected ? { color: "secondary" } : {};
    let highlightClass = "";
    if (hoursAssigned === hours) {
        highlightClass = "filled";
    } else if (hoursAssigned > hours) {
        highlightClass = "overfilled";
    }

    return (
        <div
            style={{ display: "inline-block", position: "relative" }}
            className={highlightClass}
        >
            <Button
                onClick={() => {
                    onClick(course);
                }}
                variant="outlined"
                {...buttonColor}
                {...rest}
            >
                <div style={{ display: "block" }}>
                    <div>{course}</div>
                    <div className="stats-container">
                        <span className="sub">Hours: {defaultAssignment}</span>
                        <span className="sub">
                            Filled: {numAssigned}/
                            {Math.round(10 * remainingAssignments) / 10 +
                                numAssigned}
                        </span>
                    </div>
                </div>
            </Button>
            {onChange && (
                <IconButton
                    size="small"
                    style={{
                        width: "1em",
                        height: "1em",
                        position: "absolute",
                        right: 0,
                        top: "10%"
                    }}
                    onClick={() => setDialogOpen(true)}
                >
                    <EditIcon style={{ width: ".6em" }} />
                </IconButton>
            )}
            <CourseDetailsDialog
                open={dialogOpen}
                onSave={onSave}
                onCancel={() => setDialogOpen(false)}
                onClose={() => setDialogOpen(false)}
                courseDetails={courseDetails}
            />
        </div>
    );
}
CourseHeaderButton.propTypes = {
    courseDetails: PropTypes.object,
    onChange: PropTypes.func,
    onClick: PropTypes.func
};

/**
 * Create a division in a course row for a specific number of hours.
 *
 * @returns
 */
function CourseTableRowDivision(props) {
    const { hours, children, innerRef, ...rest } = props;
    return (
        <div className="row-division" ref={innerRef} {...rest}>
            {hours != null && (
                <div className="row-division-header">{hours} hours</div>
            )}
            <div className="row-division-body">{children}</div>
        </div>
    );
}
CourseTableRowDivision.propTypes = {
    hours: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node
    ])
};

/**
 * A row listing details about a course and TAs assigned to the course.
 *
 * @param {*} props
 * @returns
 */
function CourseTableRow(props) {
    const {
        courseDetails = {},
        assignments = [],
        onAssignmentChange = function() {},
        onCourseDetailsChange,
        onCourseClick = function() {},
        ...rest
    } = props;
    function onAssignmentDelete(assignment) {
        onAssignmentChange({ ...assignment, deleted: true });
    }

    // figure out what class to apply to this course
    let highlightClass = "";
    if (courseDetails.M) {
        highlightClass = "highlight-preference-med";
    }
    if (courseDetails.H) {
        highlightClass = "highlight-preference-hi";
    }
    if (courseDetails.isNotDroppable) {
        highlightClass = "highlight-non-droppable";
    }

    // group all assignments by the number of hours
    const assignmentsByHours = {};
    for (const assignment of assignments) {
        assignmentsByHours[assignment.hours] =
            assignmentsByHours[assignment.hours] || [];
        assignmentsByHours[assignment.hours].push(assignment);
    }
    // The default assignment is special, so pick it out
    const defaultAssignments =
        assignmentsByHours[courseDetails.defaultAssignment] || [];
    delete assignmentsByHours[courseDetails.defaultAssignment];
    // all the other assignments get listed in a sorted array
    const otherAssignmentsHours = Object.keys(assignmentsByHours);
    otherAssignmentsHours.sort((a, b) => a - b);

    function makeTAItem(assignment, i) {
        const utorid = (assignment.ta || {}).utorid || assignment.ta;
        return (
            <Draggable
                draggableId={JSON.stringify({
                    course: assignment.course,
                    ta: utorid
                })}
                index={i}
                key={i}
            >
                {draggableProvided => (
                    <TAItem
                        innerRef={draggableProvided.innerRef}
                        {...draggableProvided.draggableProps}
                        {...draggableProvided.dragHandleProps}
                        ta={assignment.ta}
                        assignment={assignment}
                        onAssignmentChange={onAssignmentChange}
                        onDelete={onAssignmentDelete}
                    />
                )}
            </Draggable>
        );
    }

    return (
        <div className={`course-table-row ${highlightClass}`}>
            <div className="course-table-row-header">
                <CourseHeaderButton
                    courseDetails={courseDetails}
                    onChange={onCourseDetailsChange}
                    onClick={onCourseClick}
                />
            </div>
            <div className="course-table-row-body">
                <Droppable
                    droppableId={JSON.stringify({
                        course: courseDetails.course,
                        hours: courseDetails.defaultAssignment
                    })}
                    direction="horizontal"
                    {...rest}
                >
                    {(droppableProvided, droppableSnapshot) => (
                        <CourseTableRowDivision
                            innerRef={droppableProvided.innerRef}
                            {...droppableProvided.droppableProps}
                            hours={
                                otherAssignmentsHours.length > 0
                                    ? courseDetails.defaultAssignment
                                    : undefined
                            }
                        >
                            {defaultAssignments.map(makeTAItem)}
                            {droppableProvided.placeholder}
                        </CourseTableRowDivision>
                    )}
                </Droppable>
                {otherAssignmentsHours.map(hours => {
                    const otherAssignments = assignmentsByHours[hours];
                    return (
                        <Droppable
                            droppableId={JSON.stringify({
                                course: courseDetails.course,
                                hours: hours
                            })}
                            direction="horizontal"
                            key={`${courseDetails.course}-${hours}`}
                        >
                            {(droppableProvided, droppableSnapshot) => (
                                <CourseTableRowDivision
                                    innerRef={droppableProvided.innerRef}
                                    {...droppableProvided.droppableProps}
                                    hours={hours}
                                >
                                    {otherAssignments.map(makeTAItem)}
                                    {droppableProvided.placeholder}
                                </CourseTableRowDivision>
                            )}
                        </Droppable>
                    );
                })}
            </div>
        </div>
    );
}
CourseTableRow.propTypes = {
    courseDetails: PropTypes.object,
    assignments: PropTypes.arrayOf(PropTypes.object),
    onAssignmentChange: PropTypes.func,
    onCourseDetailsChange: PropTypes.func,
    onCourseClick: PropTypes.func
};

function SortableCourseTable(props) {
    const noop = function() {};
    const {
        TAs,
        courses,
        assignments,
        updateCourse = noop,
        updateAssignment = noop,
        setSelectedTA = noop,
        toggleSelectedCourse = noop,
        splitPaneState = { value: 220, setValue: noop }
    } = props;

    // Functions for drag and drop
    function onDragEnd(result) {
        const { destination, source, draggableId } = result;
        if (!destination) {
            // we didn't drop onto a valid target
            return;
        }
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            // we dropped into the same position in the same target
            return;
        }
        // we dropped onto a valid target
        // The IDs JSON encode the information we care about
        const assignment = JSON.parse(draggableId);
        //const fromCourse = JSON.parse(source.droppableId);
        const toCourse = JSON.parse(destination.droppableId);

        // we're changing the hours; we need to pass in the `replaceAssignment`
        // because assigments are stored as course,utorid pairs, so we need
        // a way to delete the old assignment
        updateAssignment({
            ...assignment,
            course: toCourse.course,
            hours: toCourse.hours,
            replaceAssignment: assignment
        });
    }

    function onDragStart(result) {
        if (!result.source) {
            return;
        }
        const { ta } = JSON.parse(result.draggableId);
        setSelectedTA(ta);
    }

    return (
        <div
            style={{
                display: "flex",
                position: "relative",
                overflow: "auto",
                minHeight: 300,
                flexGrow: 1
            }}
        >
            <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
                <SplitPane
                    split="vertical"
                    minSize={110}
                    defaultSize={splitPaneState.value}
                    style={{ overflow: "auto" }}
                    onChange={splitPaneState.setValue}
                >
                    <TAList TAs={TAs} />
                    <div style={{ width: "100%", overflow: "auto" }}>
                        {Object.values(courses).map((course, i) => (
                            <CourseTableRow
                                key={i}
                                courseDetails={course}
                                assignments={assignments[course.course]}
                                onAssignmentChange={updateAssignment}
                                onCourseDetailsChange={updateCourse}
                                onCourseClick={toggleSelectedCourse}
                            />
                        ))}
                    </div>
                </SplitPane>
            </DragDropContext>
        </div>
    );
}
SortableCourseTable.propTypes = {
    TAs: PropTypes.arrayOf(PropTypes.object).isRequired,
    courses: PropTypes.object.isRequired,
    assignments: PropTypes.object.isRequired,
    updateCourse: PropTypes.func,
    updateAssignment: PropTypes.func,
    setSelectedTA: PropTypes.func,
    toggleSelectedCourse: PropTypes.func
};

export { CourseHeaderButton, CourseTableRow, SortableCourseTable };
