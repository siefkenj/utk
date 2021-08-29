interface MeetingTime {
    day: "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";
    start: number;
    end: number;
    room: string;
}
interface Instructor {
    firstName: string;
    lastName: string;
    instructorId: string;
}
interface Section {
    cap: number;
    name: string;
    section: string;
    sectionNumber: string;
    students: number;
    waitlist: number;
    type: "TUT" | "LEC";
    times: MeetingTime[];
    instructor: Instructor;
}

interface CourseInfo {
    code: string;
    course: string;
    courseCode: string;
    courseDescription: string;
    courseTitle: string;
    lec: number;
    tut: number;
    students: number;
    lectures: Section[];
    tutorials: Section[];
}

function flattenTimes(times: MeetingTime[]) {
    return times
        .map((time) => `${time.day} ${time.start}-${time.end}`)
        .join("; ");
}

function flattenSection(sec: Section) {
    return [
        sec.type,
        sec.sectionNumber,
        flattenTimes(sec.times),
        sec.students,
        sec.cap,
        sec.waitlist,
    ];
}

/**
 * Return an array of arrays ("spreadsheet style") containing data about
 * all sections of the course and their enrollments.
 *
 * @export
 * @param {CourseInfo} info
 */
export function flattenCourseInfo(info: CourseInfo) {
    const ret: (string | number)[][] = [
        [
            "Course Code",
            "Section Type",
            "Section Number",
            "Meeting Times",
            "Enrolled",
            "Cap",
            "Waitlist",
        ],
    ];
    ret.push(
        ...info.lectures.map((lec) => [info.course, ...flattenSection(lec)])
    );
    ret.push(
        ...info.tutorials.map((lec) => [info.course, ...flattenSection(lec)])
    );

    return ret;
}
