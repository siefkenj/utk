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
            minHours: CELL_PARSERS.int,
            maxHours: CELL_PARSERS.int,
            previousHire: CELL_PARSERS.bool,
            preferenceH: CELL_PARSERS.list,
            preferenceM: CELL_PARSERS.list
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
function TASpreadsheet(props) {
    const { TAs = [], onChange = function() {} } = props;
    // HotTable mutates the data it's given, so make a copy of the TA
    // data before passing it off to HotTable
    const data = TAs.map(x => objectMap(x, (prop, val) => "" + val));
    const originalUTORids = TAs.map(x => x.utorid);

    function onAfterChange(changes, action) {
        // Nothing to do when HotTable initially loads data
        if (!action || action === "loadData") {
            return;
        }
        // get a list of all rows that have been changed
        const changedRows = {};
        for (const change of changes) {
            changedRows[change[0]] = true;
        }
        // HotTable makes all updates as strings. Map these
        // strings to the appropriate types
        const updates = [];
        for (const row in changedRows) {
            let taInfo = data[row];
            // If the UTORid has been updated, the TA should be deleted
            // and a new TA put in their place
            if (taInfo.utorid !== originalUTORids[row]) {
                updates.push({ utorid: originalUTORids[row], delete: true });
            }
            taInfo = objectMap(taInfo, parseCell);
            // If there is no first and last we want to
            // delete the row instead of add it
            if (!taInfo.first && !taInfo.last) {
                updates.push({ utorid: taInfo.utorid, delete: true });
            } else {
                updates.push(taInfo);
            }
        }
        onChange(updates);
    }
    return (
        <div>
            <HotTable
                root="hot"
                data={data}
                colHeaders={[
                    "Last",
                    "First",
                    "email",
                    "UTORid",
                    "ID",
                    "annotation",
                    "minHours",
                    "maxHours",
                    "preferenceH",
                    "preferenceM",
                    "prior experience?"
                ]}
                columns={[
                    { data: "last", width: 200 },
                    { data: "first", width: 200 },
                    { data: "email" },
                    { data: "utorid" },
                    { data: "id" },
                    { data: "annotation" },
                    { data: "minHours" },
                    { data: "maxHours" },
                    { data: "preferenceH", width: 300 },
                    { data: "preferenceM", width: 300 },
                    { data: "previousHire" }
                ]}
                minSpareRows={1}
                onAfterChange={onAfterChange}
            />
        </div>
    );
}
TASpreadsheet.propTypes = {
    TAs: PropTypes.arrayOf(PropTypes.object).isRequired,
    onChange: PropTypes.func
};

export { TASpreadsheet };
