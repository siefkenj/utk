import React from "react";
import PropTypes from "prop-types";
//import classNames from "classnames";

import HotTable from "react-handsontable";
//import Handsontable from "handsontable";

/**
 * Returns a new object whose keys match `obj`
 * but whose values are the result of calling
 * `func(key, val)` on each key-value pair of `obj`.
 *
 * @param {object} obj
 * @param {function} func
 * @returns {object}
 */
function objectMap(obj, func) {
    const ret = { ...obj };
    for (const key in ret) {
        ret[key] = func(key, ret[key]);
    }
    return ret;
}

/**
 * Functions to turn a cell from a string into its
 * actual datatype
 */
const CELL_PARSERS = {
    string: x => x,
    bool: x => !!x && ["true", "1", "yes"].includes(x.toLowerCase()),
    list: x => x.split(",").map(y => y.trim()),
    int: x => +x
};

/**
 * Parse `val` to the type of the corresponding `prop` according
 * to the data model for TAs. If `val` is not a string, no
 * action is performed.
 *
 * @param {string | object} prop
 * @param {string} val
 * @returns
 */
function parseCell(prop, val) {
    const parser =
        {
            hours: CELL_PARSERS.int,
            defaultAssignment: CELL_PARSERS.int
        }[prop] || CELL_PARSERS.string;

    if (!val || typeof val === "string") {
        return parser(val || "");
    }
    return val;
}

/**
 * Spreadsheet to display and update TA information
 *
 * @param {object} props
 * @param {function} props.onChange Functiont that acceps an array of TA changes
 * @returns
 */
function CoursesSpreadsheet(props) {
    const { courses = [], onChange = function() {} } = props;
    // HotTable mutates the data it's given, so make a copy of the TA
    // data before passing it off to HotTable
    const data = Object.values(courses);
    const originalCourseCodes = data.map(x => x.course);

    function onAfterChange(changes, action) {
        // Nothing to do when HotTable initially loads data
        if (!action || action === "loadData") {
            return;
        }
        console.log(action, changes);
        // get a list of all rows that have been changed
        const changedRows = {};
        for (const change of changes) {
            changedRows[change[0]] = true;
        }
        // HotTable makes all updates as strings. Map these
        // strings to the appropriate types
        const updates = [];
        for (const row in changedRows) {
            let courseInfo = data[row];
            // If the UTORid has been updated, the TA should be deleted
            // and a new TA put in their place
            if (courseInfo.course !== originalCourseCodes[row]) {
                updates.push({
                    course: originalCourseCodes[row],
                    delete: true
                });
            }
            courseInfo = objectMap(courseInfo, parseCell);
            // If there is no course name, we want to
            // delete the row instead of add it
            if (!courseInfo.course) {
                updates.push({ utorid: courseInfo.course, delete: true });
            } else {
                updates.push(courseInfo);
            }
        }
        onChange(updates);
    }
    return (
        <div>
            <HotTable
                root="coursestable"
                data={data}
                colHeaders={["Course Code", "Hours", "Default Assignment"]}
                columns={[
                    { data: "course" },
                    { data: "hours" },
                    { data: "defaultAssignment" }
                ]}
                minSpareRows={1}
                onAfterChange={onAfterChange}
            />
        </div>
    );
}
CoursesSpreadsheet.propTypes = {
    courses: PropTypes.object.isRequired,
    onChange: PropTypes.func
};

export { CoursesSpreadsheet };
