// Utility functions for dealing with timetable.iit.artsci.utoronto.ca
// datastructure

class Courses {
    fetch({ course, session, instructor }) {
        this.course = course || "";
        this.session = session;

        let { term, year } = session;
        let { lastName } = instructor || { lastName: "" };
        this.fetchPromise = fetch(
            `//www.math.toronto.edu/siefkenj/get_course_info.php?year=${year}&session=${term}&course=${
                this.course
            }&instructor=${lastName}`
        )
            .then(response => response.json())
            .then(response => {
                this.data = response;
                this.courses = [];

                if (response.status === "error") {
                    return [];
                }

                for (let [code, course] of Object.entries(this.data)) {
                    this.courses.push(
                        new Course({
                            course: code,
                            session: session,
                            data: course
                        })
                    );
                }

                return this.courses;
            });
        return this.fetchPromise;
    }
}

class Course {
    constructor({ course, session, data }) {
        this.course = course;
        this.session = session;
        this.data = data;

        this._parseData(data);
    }

    _parseData(data) {
        this.desc = data.courseDescription;
        this.courseDescription = data.courseDescription;
        this.code = data.code;
        this.courseCode = this.code;
        this.courseTitle = data.courseTitle;

        this.students = 0;
        this.lectures = [];
        this.tutorials = [];

        for (let sec of Object.values(data.meetings)) {
            sec = new Lecture(sec);
            if (sec.type === "LEC") {
                this.students += sec.students;
                this.lectures.push(sec);
            } else if (sec.type === "TUT") {
                this.tutorials.push(sec);
            }
        }

        this.lec = this.lectures.length;
        this.tut = this.tutorials.length;
    }
}

class Lecture {
    constructor(data) {
        this.data = data;

        this.students = parseInt(data.actualEnrolment, 10) || 0;
        this.cap = parseInt(data.enrollmentCapacity, 10) || 0;
        this.type = data.teachingMethod;
        this.instructor = Object.values(data.instructors)[0];
        this.section = data.sectionNumber;
        this.sectionNumber = this.section;
        this.name = this.type + " " + this.section;
        this.times = Object.values(data.schedule).map(x => {
            return {
                day: x.meetingDay,
                room: x.assignedRoom1 || x.assignedRoom2,
                start: Lecture.parseHour(x.meetingStartTime),
                end: Lecture.parseHour(x.meetingEndTime)
            };
        });
    }

    static parseHour(hourStr) {
        let [h, m] = (hourStr || "").split(/:/);
        h = parseInt(h, 10) || 0;
        m = parseInt(m, 10) || 0;
        return h + m / 60;
    }
}

export { Courses, Course, Lecture };
