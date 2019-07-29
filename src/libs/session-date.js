/*
 * Utilities for working with dates and sessions.
 */

// Class for handling session comparison and formatting
const Session = class Session {
    constructor(year, term) {
        if (!year) {
            let tmp = this.constructor.fromDate();
            year = tmp.year;
            term = tmp.term;
        }
        if (year.year) {
            term = year.term || "F";
            year = year.year;
        }
        if (!term && typeof year !== "string") {
            throw new Error(`Invalid initialization '${JSON.stringify(year)}'`);
        }
        if (!term) {
            // assume `year` is a formatted string "YYYY-<session>"
            [year, term] = year.split("-");
        }
        this.year = this.constructor.normalizeYear(year);
        this.term = term;
    }

    toString() {
        return `${this.year}-${this.term}`;
    }

    valueOf() {
        return +this.toDate();
    }

    get prettyYear() {
        return this.constructor.formatYear(this.year);
    }

    get prettyTerm() {
        switch (this.term) {
            case "F":
                return "(F) Fall Term";
            case "S":
                return "(S) Spring Term";
            case "Y":
                return "(Y) Year-long Term";
            case "SF":
                return "(F) Summer Term 1";
            case "SS":
                return "(S) Summer Term 2";
            case "SY":
                return "(Y) Summer Full Term";
            default:
                return "Unknown Term";
        }
    }

    toDate() {
        const { year, term } = this;

        switch (term) {
            case "F":
            case "Y":
                return new Date(year, 8, 1);
            case "S":
                return new Date(year + 1, 0, 1);
            case "SY":
            case "SF":
                return new Date(year + 1, 4, 1);
            case "SS":
                return new Date(year + 1, 5, 15);
            default:
                throw new Error("Unknown term ''" + term + "'");
        }
    }

    equal(b) {
        return this.constructor.equal(this, b);
    }

    static formatAsString(session) {
        return new this(session).toString();
    }

    static formatYear(year) {
        year = +year;
        return `${year}/${year + 1}`;
    }

    static normalizeYear(year) {
        if (typeof year === "number") {
            return year;
        }
        if (year instanceof Number) {
            return +year;
        }
        if (typeof year === "string") {
            if (year.includes("/")) {
                year = year.match(/(.*)\//)[1];
            }
            return +year;
        }
        throw new Error(`Cannot parse '${year}' as a year.`);
    }

    static fromDate(date = new Date()) {
        let month = date.getMonth();
        let year = date.getFullYear();
        switch (month) {
            case 0:
            case 1:
            case 2:
            case 3:
                return new Session({ term: "S", year: year - 1 });
            case 4:
            case 5:
                return new Session({ term: "SF", year: year - 1 });
            case 6:
            case 7:
            case 8:
                return new Session({ term: "SS", year: year - 1 });
            case 9:
            case 10:
            case 11:
            default:
                return new Session({ term: "F", year: year });
        }
    }

    static equal(a, b) {
        return a.year === b.year && a.term === b.term;
    }

    static ensure(session) {
        if (session instanceof this) {
            return session;
        }
        return new this(session);
    }
};

function progressInSession(now, startSession, endSession) {
    startSession = Session.ensure(startSession);
    endSession = Session.ensure(endSession);
    let startYear = startSession.year;
    let endYear = endSession.year;
    let start = +new Session({ term: "F", year: startYear });
    let end = +new Session({ term: "F", year: endYear + 1 });
    return (+now - start) / (end - start);
}

window.S = Session;
export { Session, progressInSession };
