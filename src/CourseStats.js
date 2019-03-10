import React, { Component } from "react";
//import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
//import SelectField from 'material-ui/SelectField';
import {
    Paper,
    Typography,
} from "@material-ui/core";

import { ROOMS } from "./rooms.js";

import { CourseSelect } from "./Components.js";
import { SessionDisplay } from "./components/term-select.js"
import { Session } from "./libs/session-date.js"
import { Courses } from "./utils.js";

import BigCalendar from "react-big-calendar";
import TimeGrid from "react-big-calendar/lib/TimeGrid";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";

// Setup the localizer by providing the moment (or globalize) Object
// to the correct localizer.
BigCalendar.momentLocalizer(moment); // or globalizeLocalizer

const getRange = (date, culture) => {
    let start = new Date(moment(date).startOf("week"));
    let ret = [];
    for (let i = 1; i < 6; i++) {
        ret.push(new Date(moment(start).add(i, "d")));
    }

    return ret;
};

class MyWeek extends React.Component {
    static navigate = (date, action) => {
        return date;
    };

    static title = (date, { formats, culture }) => {
        return "Week View";
    };

    render() {
        let { date, culture } = this.props;
        let range = getRange(date, culture);

        return <TimeGrid {...this.props} range={range} eventOffset={15} />;
    }
}

class CourseStats extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.state.session = Session.fromDate(new Date());
        this.state.course = {};
    }
    _getTimes(arr, startDate = new Date()) {
        // format class times as a list of start and end times
        // for events taking place in whatever week startDate takes place in.
        const weekStart = moment(startDate).startOf("week");
        let ret = [],
            k = 0;

        for (let sec of arr) {
            for (let time of sec.times) {
                let startHours = time.start;
                let endHours = time.end;
                let day = time.day;
                let start = moment(weekStart)
                    .day(day)
                    .add(startHours, "h");
                let end = moment(weekStart)
                    .day(day)
                    .add(endHours, "h");

                ret.push({
                    key: k,
                    start: new Date(start),
                    end: new Date(end),
                    title: sec.type + " " + sec.section,
                    desc: sec.assignedRoom1 || sec.assignedRoom2
                });
                k += 1;
            }
        }
        return ret;
    }
    onCourseChange = course => {
        if (!course) {
            return;
        }
        this.setState({ course });

        // find all instructors that are teaching for the course
        // and get their availability
        let promises = [];
        for (let { instructor } of course.lectures) {
            let c = new Courses();
            promises.push(
                c.fetch({ session: course.session, instructor }).then(x => {
                    let ret = [];
                    for (let cor of x) {
                        for (let lec of cor.lectures) {
                            if (typeof lec.instructor === "undefined") {
                                // cancelled lectures have no instructor
                                continue;
                            }
                            if (
                                lec.instructor.firstName ===
                                    instructor.firstName &&
                                lec.instructor.lastName === instructor.lastName
                            ) {
                                lec.course = cor;
                                ret.push(lec);
                            }
                        }
                    }
                    return ret;
                })
            );
        }
        Promise.all(promises).then(x => {
            this.setState({
                instructorCourses: [].concat(...x)
            });
        });
    };
    render() {
        const courseTitle = this.state.course.courseTitle || false;
        const courseDesc = this.state.course.courseDescription || false;
        const lecTimes = this._getTimes(this.state.course.lectures || []);
        const tutTimes = this._getTimes(this.state.course.tutorials || []);
        const instTimes = this._getTimes(this.state.instructorCourses || []);
        const session = Session.ensure(this.state.session);

        return (
            <span>
                <Paper className="section">
                    <Typography
                        variant="headline"
                        component="h2"
                        className="section-header"
                    >
                        Select Term
                    </Typography>
                    <Typography component="div">
                        Select the term for the course.
                    </Typography>
                    <SessionDisplay
                        session={session}
                        editable
                        onChange={x => {
                            this.setState({ session: x });
                        }}
                    />
                </Paper>
                <div style={{ height: 10 }} />
                <Paper className="section">
                    <Typography
                        variant="headline"
                        component="h2"
                        className="section-header"
                    >
                        Specify Course
                    </Typography>
                    <Typography component="div">
                        Enter the course number (or a prefix, like "MAT").
                    </Typography>

                    <CourseSelect
                        term={session.term}
                        year={session.prettyYear}
                        onChange={this.onCourseChange}
                    />
                </Paper>
                <div style={{ height: 10 }} />
                <Paper className="section">
                    <Typography
                        variant="headline"
                        component="h2"
                        className="section-header"
                    >
                        Course Information
                    </Typography>
                    <Typography component="div">
                        <div>
                            Title:{" "}
                            <span className="course-desc">{courseTitle}</span>
                        </div>
                        <div>
                            Description:{" "}
                            <span className="course-desc">{courseDesc}</span>
                        </div>
                    </Typography>

                    <Typography
                        variant="headline"
                        component="h4"
                        className="section-header"
                    >
                        Lecture Times
                    </Typography>
                    <div style={{ maxWidth: 800 }}>
                        <BigCalendar
                            toolbar={false}
                            events={lecTimes}
                            step={30}
                            defaultView="week"
                            views={{ week: MyWeek }}
                            defaultDate={new Date()}
                            min={
                                new Date(
                                    moment()
                                        .startOf("day")
                                        .add(9, "h")
                                )
                            }
                            max={
                                new Date(
                                    moment()
                                        .startOf("day")
                                        .add(21, "h")
                                )
                            }
                            formats={{
                                dayFormat: (date, culture, localizer) =>
                                    localizer.format(date, "dd", culture)
                            }}
                        />
                    </div>

                    <Typography
                        variant="headline"
                        component="h4"
                        className="section-header"
                    >
                        Tutorial Times
                    </Typography>
                    <div style={{ maxWidth: 800 }}>
                        <BigCalendar
                            toolbar={false}
                            events={tutTimes}
                            step={30}
                            defaultView="week"
                            views={{ week: MyWeek }}
                            defaultDate={new Date()}
                            min={
                                new Date(
                                    moment()
                                        .startOf("day")
                                        .add(9, "h")
                                )
                            }
                            max={
                                new Date(
                                    moment()
                                        .startOf("day")
                                        .add(21, "h")
                                )
                            }
                            formats={{
                                dayFormat: (date, culture, localizer) =>
                                    localizer.format(date, "dd", culture)
                            }}
                        />
                    </div>
                    <Typography
                        variant="headline"
                        component="h4"
                        className="section-header"
                    >
                        Instructor Availability
                    </Typography>
                    <div style={{ maxWidth: 800 }}>
                        <BigCalendar
                            toolbar={false}
                            events={instTimes}
                            step={30}
                            defaultView="week"
                            views={{ week: MyWeek }}
                            defaultDate={new Date()}
                            min={
                                new Date(
                                    moment()
                                        .startOf("day")
                                        .add(9, "h")
                                )
                            }
                            max={
                                new Date(
                                    moment()
                                        .startOf("day")
                                        .add(21, "h")
                                )
                            }
                            formats={{
                                dayFormat: (date, culture, localizer) =>
                                    localizer.format(date, "dd", culture)
                            }}
                        />
                    </div>
                </Paper>
            </span>
        );
    }
}

export { CourseStats };
