import React from "react";
import classNames from "classnames";

import {
    ListItem,
    Button,
    Icon,
    Avatar,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent
} from "@material-ui/core";
import PropTypes from "prop-types";
import IconButton from "@material-ui/core/IconButton";
import ArrowLeft from "@material-ui/icons/ArrowLeft";
import ArrowRight from "@material-ui/icons/ArrowRight";

import { Session, progressInSession } from "../libs/session-date.js";

import "../css/term-select.css";

// Select a session/term showing the previous and future sessions
function SessionSelectWide(props) {
    let endYear;
    let { today, startYear, selectedSession, onClick } = props;
    onClick = onClick || (() => {});
    today = today || new Date();
    const todaySession = Session.fromDate(today);
    if (!startYear) {
        startYear = todaySession.year - 1;
    } else {
        startYear = +startYear;
    }

    if (!selectedSession) {
        selectedSession = Session.fromDate(today);
    }
    selectedSession = Session.ensure(selectedSession);
    //    let setSelectedSession;
    //    [selectedSession, setSelectedSession] = React.useState(selectedSession);

    function selectSessionFactory(session) {
        return () => {
            onClick(session);
            //            setSelectedSession(session);
        };
    }

    let setStartYear;
    [startYear, setStartYear] = React.useState(startYear);

    endYear = startYear + 2;
    const progress = progressInSession(
        today,
        { year: startYear },
        { year: endYear }
    );

    const yearsLabels = Array.from(new Array(endYear - startYear + 1)).map(
        (a, b) => b + startYear
    );

    // build up table rows
    let row1 = [],
        row2 = [],
        row3 = [];
    for (let year of yearsLabels) {
        const selected = {
            year: selectedSession.year === year
        };
        selected.y =
            selected.year && ["Y", "F", "S"].includes(selectedSession.term);
        selected.f = selected.year && selectedSession.term === "F";
        selected.s = selected.year && selectedSession.term === "S";
        selected.sy =
            selected.year && ["SY", "SF", "SS"].includes(selectedSession.term);
        selected.sf = selected.year && selectedSession.term === "SF";
        selected.ss = selected.year && selectedSession.term === "SS";

        // Row for year lables
        row1.push(
            <div
                className={classNames({ year: true, selected: selected.year })}
                key={year}
                onClick={selectSessionFactory({ year: year, term: "F" })}
            >
                {Session.formatYear(year)}
            </div>
        );
        // Row for Y sessions
        row2.push(
            <div
                className={classNames({
                    "session-y": true,
                    selected: selected.y
                })}
                key={year + "Y"}
                onClick={selectSessionFactory({ year: year, term: "F" })}
            >
                Y
            </div>
        );
        row2.push(
            <div
                className={classNames({
                    "session-y": true,
                    selected: selected.sy,
                    summer: true
                })}
                key={year + "SY"}
                onClick={selectSessionFactory({ year: year, term: "SF" })}
            >
                Summer Y
            </div>
        );
        // Row for F/S sessions
        row3.push(
            <div
                className={classNames({
                    "session-f": true,
                    selected: selected.f
                })}
                key={year + "F"}
                onClick={selectSessionFactory({ year: year, term: "F" })}
            >
                F
            </div>
        );
        row3.push(
            <div
                className={classNames({
                    "session-s": true,
                    selected: selected.s
                })}
                key={year + "S"}
                onClick={selectSessionFactory({ year: year, term: "S" })}
            >
                S
            </div>
        );
        row3.push(
            <div
                className={classNames({
                    "session-f": true,
                    selected: selected.sf,
                    summer: true
                })}
                key={year + "SF"}
                onClick={selectSessionFactory({ year: year, term: "SF" })}
            >
                F
            </div>
        );
        row3.push(
            <div
                className={classNames({
                    "session-s": true,
                    selected: selected.ss,
                    summer: true
                })}
                key={year + "SS"}
                onClick={selectSessionFactory({ year: year, term: "SS" })}
            >
                S
            </div>
        );
    }

    return (
        <div className="tswc">
            <div className="term-selector-container">
                <div style={{marginRight: 3}}>
                    <IconButton
                        aria-label="Previous Year"
                        onClick={() => setStartYear(startYear - 1)}
                    >
                        <ArrowLeft />
                    </IconButton>
                </div>
                <div className="term-selector-body">
                    <div className="term-selector">
                        {row1}
                        {row2}
                        {row3}
                    </div>
                    <div className="year-progress">
                        <div
                            className="year-progress-arrow"
                            style={{ left: `${100 * progress}%` }}
							onClick={selectSessionFactory(Session.fromDate(today))}
                        >
                            <div className="year-progress-arrow-marker">⌃</div>
                            <div>Today</div>
                        </div>
                    </div>
                </div>
                <div style={{marginLeft: 3}}>
                    <IconButton
                        aria-label="Next Year"
                        onClick={() => setStartYear(startYear + 1)}
                    >
                        <ArrowRight />
                    </IconButton>
                </div>
            </div>
        </div>
    );
}
SessionSelectWide.propTypes = {
    selectedSession: PropTypes.object,
    today: PropTypes.instanceOf(Date),
    startYear: PropTypes.object,
    onClick: PropTypes.func
};

// Display the current session with an optional edit button
function SessionDisplay({ session, editable, onChange, ...rest }) {
    session = new Session(session);
    onChange = onChange || (() => {});

    const [dialogOpenState, setDialogOpenState] = React.useState(false);
    function toggleDialogState() {
        setDialogOpenState(!dialogOpenState);
    }
    function closeDialog() {
        setDialogOpenState(false);
    }

    return (
        <>
            <ListItem {...rest}>
                {editable && (
                    <Avatar>
                        <Button color="primary" onClick={toggleDialogState}>
                            <Icon>edit</Icon>
                        </Button>
                    </Avatar>
                )}
                <ListItemText
                    primary={
                        <span>
                            <Icon className="inline-icon">date_range</Icon>
                            {session.prettyYear}
                        </span>
                    }
                    secondary={session.prettyTerm}
                />
            </ListItem>
            <SessionSelectDialog
                open={dialogOpenState}
                currentSession={session}
                onClose={closeDialog}
                onChange={onChange}
            />
        </>
    );
}
SessionDisplay.propTypes = {
    session: PropTypes.object.isRequired,
    editable: PropTypes.bool,
    onChange: PropTypes.func
};

// Dialog to
function SessionSelectDialog({ onClose, onChange, currentSession, ...rest }) {
    const propCurrentSession = currentSession;
    let setCurrentSession;
    [currentSession, setCurrentSession] = React.useState(currentSession);
    // if the dialog is not showing, set currentSession to the passed in prop
    // so the next time the dialog is opened it starts in the proper state
    if (!rest.open) {
        if (
            !Session.ensure(propCurrentSession).equal(
                Session.ensure(currentSession)
            )
        ) {
            setCurrentSession(propCurrentSession);
        }
    }
    function changeSession() {
        onClose();
        onChange(currentSession);
    }
    return (
        <Dialog onClose={onClose} maxWidth="xl" {...rest}>
            <DialogTitle>Select Session</DialogTitle>
            <DialogContent>
                <SessionDisplay session={currentSession} />
                <div style={{ minWidth: "700px", minHeight: "100px" }}>
                    <SessionSelectWide
                        selectedSession={currentSession}
                        onClick={session => setCurrentSession(session)}
                    />
                </div>
            </DialogContent>
            <DialogActions>
                <Button color="primary" onClick={onClose}>
                    Cancel
                </Button>
                <Button color="primary" onClick={changeSession}>
                    Select
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export { SessionSelectWide, SessionDisplay };
