import React, { useEffect } from "react";
import { DragDropContext } from "react-beautiful-dnd";

import {
    CourseHeaderButton,
    CourseTableRow,
    SortableCourseTable
} from "./course-table.js";
import { SessionDisplay, SessionSelectWide } from "./term-select.js";
import { Session } from "../libs/session-date.js";
import { useStoreState, useStoreActions } from "easy-peasy";
import { TAItem, TAList } from "./ta-display.js";
import { TASpreadsheet } from "./ta-spreadsheet.js";
import { CoursesSpreadsheet } from "./courses-spreadsheet.js";
import SplitPane from "react-split-pane";
import { SaveDataButton, LoadDataButton } from "./savers.js";

function TabWidgetShowcase(props) {
    const currentSession =
        useStoreState(state => state.test.currentSession) ||
        Session.fromDate(new Date());
    const setCurrentSession = useStoreActions(
        actions => actions.test.setCurrentSession
    );
    const courseDetails = useStoreState(state => state.test.courses)[
        "MAT135 F"
    ];
    const allState = useStoreState(state => state.test.allState);
    const courses = useStoreState(state => state.test.courses);
    const updateCourse = useStoreActions(actions => actions.test.updateCourse);
    const TAs = useStoreState(state => state.test.TAs);
    const sampleTA = TAs[0] || {};
    const assignments = useStoreState(state => state.test.assignments);
    const sampleAssignment = (assignments["MAT135 F"] || [{}])[0];
    const restoreAllState = useStoreActions(
        actions => actions.test.restoreAllState
    );
    const { setSelectedTA, toggleSelectedCourse } = useStoreActions(
        actions => actions.test
    );

    // create some default values
    const updateTA = useStoreActions(actions => actions.test.updateTA);
    const updateTAs = useStoreActions(actions => actions.test.updateTAs);
    const updateAssignment = useStoreActions(
        actions => actions.test.updateAssignment
    );
    useEffect(() => {
        updateCourse({
            course: "MAT135 F",
            hours: 400,
            defaultAssignment: 75,
            hoursAssigned: 90,
            numAssigned: 2,
            history: [
                {
                    hours: 400,
                    defaultAssignment: 70,
                    _message: "Enrollment increase",
                    _date: "2019-02-22T03:45:41.866Z"
                },
                {
                    hours: 300,
                    _message: "Initial offer",
                    _date: "2019-02-20T03:40:41.866Z"
                }
            ]
        });
        updateCourse({
            course: "MAT136 S",
            hours: 400,
            defaultAssignment: 60,
            hoursAssigned: 0,
            numAssigned: 0,
            history: []
        });
        updateTA({
            utorid: "xxx",
            email: "a@a.com",
            first: "Nacy",
            last: "Drew",
            annotation: "P"
        });
        updateTA({
            utorid: "yyy",
            email: "b@a.com",
            first: "Ron",
            last: "Clem",
            annotation: "U"
        });
        updateTA({
            utorid: "yyy",
            email: "b@a.com",
            first: "Ron",
            last: "Clemont",
            annotation: "U"
        });
        updateTA({
            utorid: "zzz",
            email: "b@a.com",
            first: "Bob",
            last: "Dando",
            annotation: "U",
            preferenceH: ["MAT135"],
            preferenceM: ["MAT136"]
        });
        updateAssignment({ ta: "xxx", course: "MAT135 F", hours: 15 });
        updateAssignment({ ta: "yyy", course: "MAT135 F", hours: 25 });
        updateAssignment({ ta: "yyy", course: "MAT135 F", hours: 35 });
    }, []);

    //const [currentSession, setCurrentSession] = useState(
    //    Session.fromDate(new Date())
    //);

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
        const fromCourse = JSON.parse(source.droppableId);
        const toCourse = JSON.parse(destination.droppableId);

        console.log("from-to", fromCourse, toCourse, assignment);

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
        <div>
            <div>SaveDataButton/LoadDataButton</div>
            <div>
                <SaveDataButton data={allState} />
                <LoadDataButton
                    onError={console.warn}
                    onChange={restoreAllState}
                    sampleData={allState}
                />
            </div>
            <div>CourseHeaderButton</div>
            <div>
                {courseDetails && (
                    <CourseHeaderButton
                        courseDetails={courseDetails}
                        onChange={updateCourse}
                        onClick={console.log}
                    />
                )}
            </div>
            <div>TASpreadsheet</div>
            <div style={{ display: "flex" }}>
                <TASpreadsheet TAs={TAs} onChange={updateTAs} />
            </div>
            <div>CoursesSpreadsheet</div>
            <div style={{ display: "flex" }}>
                <CoursesSpreadsheet
                    courses={courses}
                    onChange={x => x.forEach(y => updateCourse(y))}
                />
            </div>
            <div>TAItem</div>
            <div style={{ display: "flex" }}>
                <TAItem ta={sampleTA} />
                <TAItem
                    ta={sampleAssignment.ta}
                    assignment={sampleAssignment}
                    onAssignmentChange={updateAssignment}
                    onDelete={a => {
                        updateAssignment({ ...a, deleted: true });
                    }}
                />
            </div>
            <div>SortableCourseTable</div>
            <div>
                <SortableCourseTable
                    TAs={TAs}
                    courses={courses}
                    assignments={assignments}
                    updateCourse={updateCourse}
                    updateAssignment={updateAssignment}
                    setSelectedTA={setSelectedTA}
                    toggleSelectedCourse={toggleSelectedCourse}
                />
            </div>
            <div>TAList & CourseTableRow</div>
            <div
                style={{
                    display: "flex",
                    position: "relative",
                    overflow: "auto",
                    minHeight: 300
                }}
            >
                <DragDropContext
                    onDragEnd={onDragEnd}
                    onDragStart={onDragStart}
                >
                    <SplitPane split="vertical" minSize={110} defaultSize={220}>
                        <TAList TAs={TAs} />
                        <div style={{ width: "100%" }}>
                            {Object.values(courses).map((course, i) => (
                                <CourseTableRow
                                    key={i}
                                    courseDetails={course}
                                    assignments={assignments[course.course]}
                                    onAssignmentChange={updateAssignment}
                                    onCourseDetailsChange={updateCourse}
                                    onCourseClick={toggleSelectedCourse}
                                    isDropDisabled={false}
                                />
                            ))}
                        </div>
                    </SplitPane>
                </DragDropContext>
            </div>
            <div>SessionDisplay</div>
            <div>
                <SessionDisplay session={currentSession} />
            </div>
            <div>SessionSelectWide</div>
            <div>
                <SessionSelectWide
                    selectedSession={currentSession}
                    onClick={setCurrentSession}
                />
            </div>
        </div>
    );
}

export { TabWidgetShowcase };
