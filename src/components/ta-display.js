import React from "react";
import { useProp } from "../libs/hooks.js";
import classNames from "classnames";
import { Draggable, Droppable } from "react-beautiful-dnd";

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
    TableHead,
    Tooltip
} from "@material-ui/core";
import PropTypes from "prop-types";
import IconButton from "@material-ui/core/IconButton";
import EditIcon from "@material-ui/icons/Edit";
import CloseIcon from "@material-ui/icons/Close";

import "../css/ta-display.css";

function Avatar(props) {
    const { children, ...rest } = props;
    return <div {...rest}>{children}</div>;
}

function TADetailsDialog(props) {
    const {
        ta,
        assignment = { course: "NOT GIVEN", hours: 0 },
        onSave = function() {},
        onCancel = function() {},
        ...rest
    } = props;
    const [hours, setHours] = useProp(assignment.hours, !rest.open);
    const [message, setMessage] = React.useState("");

    function onSaveClick() {
        const newState = { ...assignment, hours, message };
        onSave(newState);
    }

    const caption = {
        hours: "Hours",
        course: "Course",
        deleted: "Deleted",
        rejected: "Rejected"
    };
    // Assemble rows of history for the history table
    const history = [...(assignment.history || [])].reverse().map(item => {
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
            <DialogTitle>
                {ta.first} {ta.last} - {assignment.course} Assignment
            </DialogTitle>
            <DialogContent>
                <TextField
                    label="Hours"
                    value={hours}
                    onChange={e => setHours(e.target.value)}
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
                                Name (annotation)
                            </TableCell>
                            <TableCell>
                                {ta.last}, {ta.first} ({ta.annotation})
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell component="th" scope="row">
                                UTORid/id
                            </TableCell>
                            <TableCell>
                                {ta.utorid} / {ta.id || "<not given>"}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell component="th" scope="row">
                                email
                            </TableCell>
                            <TableCell>{ta.email}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell component="th" scope="row">
                                Preference High
                            </TableCell>
                            <TableCell>{ta.preferenceH}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell component="th" scope="row">
                                Preference Medium
                            </TableCell>
                            <TableCell>{ta.preferenceM}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell component="th" scope="row">
                                Hours (min/max requested)
                            </TableCell>
                            <TableCell>
                                {ta.minHours} - {ta.maxHours}
                            </TableCell>
                        </TableRow>
                        {ta.assigned && (
                            <TableRow>
                                <TableCell component="th" scope="row">
                                    Assignment(s)
                                </TableCell>
                                <TableCell>
                                    ({ta.assigned.length}) {ta.assigned}{" "}
                                    (Cumulative hours: {ta.assignedHours})
                                </TableCell>
                            </TableRow>
                        )}
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

function TAItem(props) {
    const {
        ta = {},
        assignment,
        highlight,
        onDelete = function() {},
        onAssignmentChange,
        innerRef, // needed for drag and drop
        ...rest
    } = props;
    const {
        utorid,
        first,
        last,
        email,
        preferenceH,
        preferenceM,
        annotation,
        minHours,
        maxHours,
        assigned,
        assignedHours,
        previousHire,
        H,
        M,
        inSelectedCourse
    } = ta;

    const taInfo = {};
    const name = `${first} ${last}`;

    const [dialogOpen, setDialogOpen] = React.useState(false);
    function onSave(newAssignment) {
        if (onAssignmentChange) {
            onAssignmentChange(newAssignment);
        }
        setDialogOpen(false);
    }

    // default, assume the hours are under. e.g., if
    // assignedHours is null.
    let hoursFilled = "hours-under";
    if (assignedHours > maxHours) {
        hoursFilled = "hours-over";
    } else if (assignedHours <= maxHours && assignedHours >= minHours) {
        hoursFilled = "hours-match";
    } else if (taInfo.unknownTA) {
        hoursFilled = "hours-unknown";
    }

    let highlightClass = "";
    if (M) {
        highlightClass = "highlight-preference-med";
    }
    if (H) {
        highlightClass = "highlight-preference-hi";
    }
    let highlightClass2 = inSelectedCourse ? "in-selected-course" : "";

    const tooltip = (
        <div className="ta-tooltip">
            <div>
                {last}, {first} {!previousHire && "(New)"} UTORid: {utorid}{" "}
                email: {email}
            </div>
            <div>
                Assigned: {assignedHours} Min: {minHours} Max: {maxHours}
            </div>
            <div>Assignment: [{(assigned || []).join(", ")}] </div>
            <div>Preference (High): {(preferenceH || []).join(", ")} </div>
            <div>Preference (Med): {(preferenceM || []).join(", ")} </div>
        </div>
    );
    return (
        <div ref={innerRef} className="ta-chip-drag-wrapper" {...rest}>
            <Tooltip enterDelay={1000} title={tooltip}>
                <div
                    className={classNames([
                        "ta-chip",
                        hoursFilled,
                        highlightClass,
                        highlightClass2
                    ])}
                >
                    <Avatar className="ta-avatar">
                        {annotation}
                        {!previousHire && "*"}
                    </Avatar>
                    <div className={"ta-chip-inner2"}>
                        <div>
                            {name} ({utorid})
                        </div>
                        <div>
                            {assignedHours} / {minHours}-{maxHours}
                        </div>
                    </div>
                    {assignment && (
                        <div className="ta-chip-buttons">
                            <IconButton
                                size="small"
                                classes={{ root: "ta-chip-action" }}
                                onClick={() => setDialogOpen(true)}
                            >
                                <EditIcon />
                            </IconButton>
                            <IconButton
                                onClick={() => onDelete(assignment)}
                                size="small"
                                classes={{ root: "ta-chip-action" }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </div>
                    )}
                </div>
            </Tooltip>
            <TADetailsDialog
                ta={ta}
                assignment={assignment}
                open={dialogOpen}
                onCancel={() => setDialogOpen(false)}
                onClose={() => setDialogOpen(false)}
                onSave={onSave}
            />
        </div>
    );
}

TAItem.propTypes = {
    onAssignmentChange: PropTypes.func,
    onDelete: PropTypes.func,
    ta: PropTypes.object,
    assignment: PropTypes.object
};

/**
 * A list of all TAs. TAs can be dragged from this list.
 *
 * @param {*} props
 * @returns
 */
function TAList(props) {
    const { TAs } = props;

    function makeTAItem(ta, i) {
        const utorid = ta.utorid || ta;
        return (
            <Draggable
                draggableId={JSON.stringify({
                    course: null,
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
                        ta={ta}
                    />
                )}
            </Draggable>
        );
    }
    return (
        <Droppable droppableId={JSON.stringify({})} isDropDisabled={true}>
            {(droppableProvided, droppableSnapshot) => (
                <div
                    ref={droppableProvided.innerRef}
                    {...droppableProvided.droppableProps}
                    className="ta-list2"
                >
                    {TAs.map(makeTAItem)}
                    {droppableProvided.placeholder}
                </div>
            )}
        </Droppable>
    );
}
TAList.propTypes = {
    TAs: PropTypes.arrayOf(PropTypes.object).isRequired
};

export { TAItem, TAList };
