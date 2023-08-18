import React from "react";
import { saveAs } from "file-saver";
import { readAsText } from "promise-file-reader";
import { Button } from "@material-ui/core";
import PropTypes from "prop-types";
import SaveIcon from "@material-ui/icons/Save";
import OpenInBrowserIcon from "@material-ui/icons/OpenInBrowser";

/**
 * But to save `data` to a local file
 *
 * @param {*} props
 * @returns
 */
function SaveDataButton(props) {
    const { data } = props;
    function onClick() {
        const blob = new Blob([JSON.stringify(data, null, 4)], {
            type: "text/plain;charset=utf-8"
        });
        saveAs(
            blob,
            `ta-data-export-${new Date().toLocaleDateString("en-CA")}.json`
        );
    }
    return (
        <Button color="primary" variant="contained" onClick={onClick}>
            Save Data
            <SaveIcon style={{ marginLeft: 16 }} />
        </Button>
    );
}
SaveDataButton.propTypes = {
    data: PropTypes.object.isRequired
};

/**
 * Button to load JSON data from a local file. If `props.sampleData`
 * is provided, the parsed JSON is check against `props.sampleData` to
 * make sure its form matches
 *
 * @param {*} props
 * @returns
 */
function LoadDataButton(props) {
    const {
        onChange = function() {},
        onError = function() {},
        sampleData
    } = props;

    async function onFileChange(e) {
        if (e.target.files.length === 0) {
            return;
        }
        const file = e.target.files[0];
        const data = await readAsText(file);
        try {
            const parsed = JSON.parse(data);
            // If `sampleData` is provided, make sure our JSON conforms to it.
            if (
                sampleData &&
                !Object.keys(sampleData).every(prop => !!parsed[prop])
            ) {
                onError(
                    `JSON file "${
                        file.name
                    }" does not have the right keys. Expected ${Object.keys(
                        sampleData
                    )} but got ${Object.keys(parsed)}`
                );
                return;
            }
            onChange(parsed);
        } catch (e) {
            console.warn("Failed to parse JSON", data);
            onError(`Failed to parse JSON file "${file.name}"`);
        }
    }
    return (
        <>
            <input
                accept="application/json"
                id="raised-button-file"
                type="file"
                style={{ display: "none" }}
                onChange={onFileChange}
            />
            <label htmlFor="raised-button-file">
                <Button variant="contained" component="span">
                    Load
                    <OpenInBrowserIcon style={{ marginLeft: 16 }} />
                </Button>
            </label>
        </>
    );
}
LoadDataButton.propTypes = {
    onChange: PropTypes.func,
    onError: PropTypes.func,
    sampleData: PropTypes.object
};

export { SaveDataButton, LoadDataButton };
