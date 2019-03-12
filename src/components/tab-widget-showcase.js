import React, { useState } from "react";

import { CourseHeaderButton } from "./course-table.js";
import { SessionDisplay, SessionSelectWide } from "./term-select.js";
import { Session } from "../libs/session-date.js";

function TabWidgetShowcase(props) {
    const [currentSession, setCurrentSession] = useState(
        Session.fromDate(new Date())
    );

    return (
        <div>
            <div>CourseHeaderButton</div>
            <div>
                <CourseHeaderButton
                    courseDetails={{
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
                    }}
                    onChange={console.log}
                    onClick={() => console.log("me clicked")}
                />
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
