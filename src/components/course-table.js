import React from "react";
import { useProp } from "../libs/hooks.js";
import classNames from "classnames";

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
} from "@material-ui/core";
import PropTypes from "prop-types";
import IconButton from "@material-ui/core/IconButton";
import Edit from "@material-ui/icons/Edit";

function CourseDetailsDialog(props) {
    const { courseDetails, onSave, onCancel, ...rest } = props;
    const [hours, setHours] = useProp(courseDetails.hours, !rest.open);
    const [defaultAssignment, setDefaultAssignment] = useProp(
        courseDetails.defaultAssignment,
        !rest.open
    );
    const [message, setMessage] = React.useState("");

    function onSaveClick() {
        const newState = { ...courseDetails, hours, defaultAssignment };
        onSave(newState);
    }

    const caption = {
        hours: "Total Hours",
        defaultAssignment: "Default Assignment"
    };
    // Assemble rows of history for the history table
    const history = courseDetails.history.map(item => {
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
                    onChange={setMessage}
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
        history
    } = courseDetails;
    const remainingAssignments = (hours - hoursAssigned) / defaultAssignment;
    const [dialogOpen, setDialogOpen] = React.useState(false);

    function onSave(courseDetails) {
        if (onChange) {
            onChange(courseDetails);
        }
        setDialogOpen(false);
    }

    return (
        <div style={{ display: "inline-block", position: "relative" }}>
            <Button onClick={onClick}>
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
                    <Edit style={{ width: ".6em" }} />
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

export { CourseHeaderButton };
