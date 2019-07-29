import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useStoreState, useStoreActions } from "easy-peasy";
import { SortableCourseTable } from "./course-table";
import { AppBar, Tabs, Tab, Button } from "@material-ui/core";
import { SaveDataButton, LoadDataButton } from "./savers";
import { SessionDisplay, SessionSelectWide } from "./term-select";
import { Session } from "../libs/session-date";
import { TASpreadsheet } from "./ta-spreadsheet";
import { CoursesSpreadsheet } from "./courses-spreadsheet";

import "../css/assign-tas-to-courses.css";

function TabPanel(props) {
    const { value, index, children } = props;
    if (value !== index) {
        return null;
    }
    return <>{children}</>;
}
TabPanel.propTypes = {
    index: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

function AssingTAsToCourses(props) {
    const [currTab, setCurrTab] = React.useState(0);
    const {
        TAs,
        courses,
        assignments,
        allState,
        currentSession
    } = useStoreState(state => state.test);
    const {
        updateCourse,
        updateAssignment,
        setSelectedTA,
        toggleSelectedCourse,
        restoreAllState,
        setCurrentSession,
        updateTAs
    } = useStoreActions(actions => actions.test);

    if (!currentSession) {
        setCurrentSession(new Session());
        return null;
    }

    return (
        <div className="assign-tas-to-courses-container">
            <AppBar position="static" style={{ flexDirection: "row" }}>
                <Tabs
                    value={currTab}
                    onChange={(e, value) => setCurrTab(value)}
                >
                    <Tab label="Assign TAs" />
                    <Tab label="TA Spreadsheet" />
                    <Tab label="Courses Spreadsheet" />
                    <Tab label="Admin" />
                </Tabs>
            </AppBar>
            <TabPanel value={currTab} index={0}>
                <SortableCourseTable
                    TAs={TAs}
                    courses={courses}
                    assignments={assignments}
                    updateCourse={updateCourse}
                    updateAssignment={updateAssignment}
                    setSelectedTA={setSelectedTA}
                    toggleSelectedCourse={toggleSelectedCourse}
                />
            </TabPanel>
            <TabPanel value={currTab} index={1}>
                <TASpreadsheet TAs={TAs} onChange={updateTAs} />
            </TabPanel>
            <TabPanel value={currTab} index={2}>
                <CoursesSpreadsheet
                    courses={courses}
                    onChange={x => x.forEach(y => updateCourse(y))}
                />
            </TabPanel>
            <TabPanel value={currTab} index={3}>
                <div style={{ padding: 10 }}>
                    <SaveDataButton data={allState} />
                    <LoadDataButton
                        sampleData={allState}
                        onChange={restoreAllState}
                        onError={console.warn}
                    />
                    <span>
                        <SessionDisplay
                            session={currentSession}
                            editable
                            onChange={setCurrentSession}
                        />
                    </span>
                </div>
            </TabPanel>
        </div>
    );
}

export { AssingTAsToCourses };
