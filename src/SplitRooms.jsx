import React, { Component } from "react";
//import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
//import SelectField from 'material-ui/SelectField';
import {
    Paper,
    List,
    ListItem,
    TextField,
    Typography,
    ListItemText,
    LinearProgress,
    Snackbar,
    Input,
    Button
} from "@material-ui/core";

import { ROOMS } from "./rooms";

import { TermItem } from "./Components";
import { AutocompleteSelect } from "./AutocompleteSelect";
import HotTable from "react-handsontable";
import Combinatorics from "js-combinatorics";
window.Combinatorics = Combinatorics;

function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function pack(names, rooms) {
    // Accepts a list of groups (number
    // of people in each part of the aphabet)
    // and a list of rooms w/ capacities, and
    // tries to pack the people into the rooms.

    // e.g.
    //
    //let [rooms, names] = [
    //    [
    //        { name: "EX200", capacity: 316 },
    //        { name: "EX100", capacity: 309 },
    //        { name: "EX300", capacity: 106 },
    //        { name: "EX310", capacity: 100 },
    //        { name: "EX320", capacity: 100 }
    //    ],
    //    [
    //        { name: "A", size: 11 },
    //        { name: "B", size: 14 },
    //        { name: "C", size: 63 },
    //        { name: "D", size: 17 },
    //        { name: "E", size: 7 },
    //        { name: "F", size: 13 },
    //        { name: "G", size: 16 },
    //        { name: "H", size: 46 },
    //        { name: "J", size: 24 },
    //        { name: "K", size: 20 },
    //        { name: "L", size: 77 },
    //        { name: "M", size: 18 },
    //        { name: "N", size: 7 },
    //        { name: "P", size: 19 },
    //        { name: "Q", size: 9 },
    //        { name: "R", size: 4 },
    //        { name: "S", size: 43 },
    //        { name: "T", size: 21 },
    //        { name: "V", size: 4 },
    //        { name: "W", size: 57 },
    //        { name: "X", size: 34 },
    //        { name: "Y", size: 53 },
    //        { name: "Z", size: 81 }
    //    ]
    //];

    if (rooms.length === 0) {
        return null;
    }
    function tryPack(names, rooms) {
        // greedily try an pack names into rooms.
        // return null if they won't fit.

        // create a copy of rooms
        rooms = rooms.map(x => {
            return { ...x };
        });
        let i = 0,
            j = 0;
        while (j < names.length && i < rooms.length) {
            let name = names[j];
            if (rooms[i].capacity > name.size) {
                rooms[i].capacity -= name.size;
                rooms[i].names = (rooms[i].names || []).concat([name]);
                j += 1;
            } else {
                i += 1;
                if (i >= rooms.length) {
                    // we tried to pack and we couldn't doit
                    return null;
                }
            }
        }
        return rooms;
    }

    let perms = Combinatorics.permutation(rooms);
    let p = perms.next();
    while (p) {
        let packed = tryPack(names, p);
        if (packed) {
            return packed;
        }
        p = perms.next();
    }
    return null;
}

function namesToStats(names) {
    // given an array of {name, size},
    // return the letter range and total
    let count = names.map(({ name, size }) => size).reduce((a, b) => a + b, 0);
    let letters = names.map(({ name, size }) => name);
    letters.sort();
    let range = letters[0];
    if (letters.length > 1) {
        range = range + "–" + letters[letters.length - 1]; // ndash in there :-)
    }
    return { range, count };
}

class RoomItem extends Component {
    render() {
        const {
            bldg,
            room,
            capacity,
            onChange,
            fillStats,
            ...other
        } = this.props;
        return (
            <ListItem {...other}>
                <ListItemText
                    primary={
                        <Typography>
                            {bldg} {room}
                        </Typography>
                    }
                />
                <div>
                    {!!fillStats || ( // if we have no fillStats, we want to display editable capacity
                        <span>
                            <span style={{ paddingRight: 10 }}>
                                Max Capacity:
                            </span>
                            <Input value={capacity} onChange={onChange} />
                        </span>
                    )}
                    {!!fillStats && (
                        <span style={{ display: "inline-block", width: 100 }}>
                            <span
                                style={{
                                    paddingRight: 10,
                                    paddingLeft: 10,
                                    fontWeight: "bold"
                                }}
                            >
                                {fillStats.range}
                            </span>
                            <LinearProgress
                                color="secondary"
                                variant="determinate"
                                value={
                                    (fillStats.count / fillStats.capacity) * 100
                                }
                            />
                            <span>
                                {fillStats.count} / {fillStats.capacity}
                            </span>
                        </span>
                    )}
                </div>
            </ListItem>
        );
    }
}

class SplitRooms extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.state.rooms = {};
        this.state.session = TermItem.dateToSession(new Date());
        this.state.letterCounts = {};
        this.state.assignedRooms = [];
        this.state.numLetters = 1;
        this.state.numLettersTxt = "1";

        this.data = {};
        this.data.names = [[]];
        // get a list of rooms by ID
        this.roomsById = {};
        for (let room of ROOMS) {
            this.roomsById[room.id] = {
                bldg: room.attributes.bldg,
                room: room.attributes.room,
                capacity: room.attributes.capacity
            };
        }
        this.roomOptions = [];
        for (let [key, val] of Object.entries(this.roomsById)) {
            this.roomOptions.push({
                value: key,
                label: val.bldg + " " + val.room
            });
        }
    }

    updateRooms = rooms => {
        if (typeof rooms === "string") {
            // We've gotten a comma separated list of room IDs
            // this adds or removes rooms
            rooms = rooms.split(",");
            let newState = {};
            for (let key of rooms) {
                newState[key] = this.state.rooms[key] || this.roomsById[key];
            }

            this.setState({ rooms: newState });
        } else if (typeof rooms === "object") {
            // we're an object, assume we're a single room
            // reference. Update that room, but don't add or remove
            // a room.
            let [key, val] = rooms;
            let newState = { ...this.state.rooms };
            newState[key] = val;
            this.setState({ rooms: newState });
        }
    };

    roomsSelected = vals => {
        this.setState({ selected: vals });
        this.updateRooms(vals);
    };

    nameListChanged = (changes, action) => {
        if (!this.refs.hot || !this.refs.hot.hotInstance) {
            return;
        }
        let hot = this.refs.hot.hotInstance;
        let table = hot.getData();
        // flatten the array and store that
        this.data.students = [].concat.apply([], table);

        let count = {};
        let numLetters = this.state.numLetters || 1;
        for (let name of this.data.students) {
            let letter = capitalize((name || "").slice(0, numLetters));
            count[letter] = (count[letter] || 0) + 1;
        }
        delete count[""];

        let total = Object.values(count).reduce((a, b) => a + b, 0);

        if (JSON.stringify(count) !== JSON.stringify(this.state.letterCounts)) {
            this.setState({ letterCounts: count, totalStudents: total });
        }
    };

    splitRooms = () => {
        let rooms = Object.entries(this.state.rooms).map(([key, room]) => {
            return { name: key, ...room };
        });
        let people = Object.entries(this.state.letterCounts).map(
            ([key, val]) => {
                return { name: key, size: val };
            }
        );
        people.sort((a, b) => (a.name === b.name ? 0 : a.name > b.name));
        let split = pack(people, rooms);

        if (!split) {
            this.setState({
                showError: true,
                currentError: "Could not fit students into rooms"
            });
            return;
        }

        let assignedRooms = [];
        for (let room of split) {
            let stats = {
                range: "",
                count: 0
            };
            if (room.names) {
                stats = namesToStats(room.names);
            }
            assignedRooms.push({
                name: room.name,
                room: room.room,
                bldg: room.bldg,
                capacity: stats.count + room.capacity,
                fillStats: {
                    range: stats.range,
                    count: stats.count,
                    capacity: stats.count + room.capacity
                }
            });
        }

        this.setState({ assignedRooms });
    };

    render() {
        const selected = this.state.selected;
        const roomList = Object.entries(this.state.rooms).map(
            ([key, room], i) => {
                return (
                    <RoomItem
                        key={key}
                        {...room}
                        style={{ backgroundColor: "aliceblue" }}
                        onChange={event => {
                            let value = event.target.value;
                            let newState = { ...room };
                            newState.capacity = +value;
                            this.updateRooms([key, newState]);
                        }}
                    />
                );
            }
        );

        const letterCountsArr = Object.entries(this.state.letterCounts);
        letterCountsArr.sort((a, b) => (a[0] === b[0] ? 0 : a[0] > b[0]));
        const letterCounts = letterCountsArr.map(([letter, count], key) => {
            return (
                <span style={{ paddingRight: 8 }} key={key}>
                    {letter}: {count}
                </span>
            );
        });

        const roomCapacity = Object.values(this.state.rooms)
            .map(x => x.capacity)
            .reduce((a, b) => a + b, 0);

        const assignedRooms = this.state.assignedRooms.map((room, key) => {
            return (
                <RoomItem
                    room={room.room}
                    bldg={room.bldg}
                    capacity={room.capacity}
                    fillStats={room.fillStats}
                    key={key}
                />
            );
        });

        return (
            <div>
                <Paper className="section">
                    <Typography
                        variant="headline"
                        component="h2"
                        className="section-header"
                    >
                        Select Rooms
                    </Typography>
                    <Typography component="p">
                        Select midterm rooms and optionally adjust their max
                        capacity.
                    </Typography>
                    <div style={{ display: "flex" }}>
                        <AutocompleteSelect
                            suggestions={this.roomOptions}
                            selected={selected}
                            onChange={this.roomsSelected}
                        />
                    </div>
                    <List>{roomList}</List>
                </Paper>
                <div style={{ height: 10 }} />
                <Paper className="section">
                    <Typography
                        variant="headline"
                        component="h2"
                        className="section-header"
                    >
                        Specify Names
                    </Typography>
                    <Typography component="p">
                        Copy and paste a student roster (last-names only) to get
                        a count of how many names there are starting with a
                        given letter of the alphabet.
                    </Typography>
                    <div style={{ display: "flex" }}>
                        <div style={{ width: 200, zIndex: 0 }}>
                            <HotTable
                                root="hot"
                                ref="hot"
                                data={this.data.names}
                                colHeaders={["Last Names"]}
                                rowHeaders={true}
                                height={200}
                                onAfterChange={this.nameListChanged}
                                minSpareRows={1}
                                minCols={1}
                            />
                        </div>
                        <div style={{ paddingLeft: 5 }}>
                            <TextField
                                label="Use first N letters"
                                value={this.state.numLettersTxt}
                                onChange={event => {
                                    let numLetters = parseInt(
                                        event.target.value || "1",
                                        10
                                    );
                                    numLetters =
                                        isNaN(numLetters) ||
                                        !isFinite(numLetters)
                                            ? 1
                                            : numLetters;
                                    this.setState({
                                        numLettersTxt: event.target.value,
                                        numLetters
                                    });
                                }}
                            />
                            <Typography component="p">
                                {this.state.totalStudents || 0} Students. By
                                letter: <br />
                                {letterCounts}
                            </Typography>
                        </div>
                    </div>
                </Paper>
                <div style={{ height: 10 }} />
                <Paper className="section">
                    <Typography
                        variant="headline"
                        component="h2"
                        className="section-header"
                    >
                        Split Rooms
                    </Typography>
                    <Typography component="p">
                        Divide students among rooms using the following rules:
                        (1) no room exceed max capacity, and (2) all rooms
                        contain contiguous sections of the alphabet.
                    </Typography>
                    <div style={{ display: "flex", marginTop: 10 }}>
                        <div style={{ width: 200, zIndex: 0 }}>
                            <Typography component="p">
                                Students: {this.state.totalStudents || 0}
                                <br />
                                Available Space: {roomCapacity}
                            </Typography>
                        </div>
                        <div style={{ paddingLeft: 5 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={this.splitRooms}
                            >
                                Split
                            </Button>
                            <Typography component="p" />
                            <List>{assignedRooms}</List>
                        </div>
                    </div>
                </Paper>
                <Snackbar
                    open={this.state.showError}
                    onClose={() => {
                        this.setState({ showError: false });
                    }}
                    message={this.state.currentError}
                />
            </div>
        );
    }
}

/*
const beginTime = new Date();

const ROOM_BITS = Math.ceil(Math.log2(rooms.length));
let solver = new Logic.Solver();
let nameVars = [],
    sizeVars = [];
for (let { name, size } of names) {
    nameVars.push(Logic.variableBits(name, ROOM_BITS));
    sizeVars.push(Logic.constantBits(size));
}

// make sure the alphabet is never broken
// with the rule for (A,B,_,...,_,C) A == C => A == B
for (let gap = 2; gap < nameVars.length - 2; gap++) {
    for (let i = gap; i < nameVars.length; i++) {
        let [A, B, C] = [nameVars[i - gap], nameVars[i - gap + 1], nameVars[i]];
        solver.require(
            Logic.implies(Logic.equalBits(A, C), Logic.equalBits(A, B))
        );
    }
}

// Make sure we cannot use a room that is out of range
for (let i = rooms.length; i < Math.pow(2, ROOM_BITS); i++) {
    for (let name of nameVars) {
        solver.require(Logic.lessThan(name, Logic.constantBits(i)));
    }
}

// get a list of all runs
let runs = [];
for (let runlen = 1; runlen < nameVars.length; runlen++) {
    for (let i = 0; i < nameVars.length - runlen; i++) {
        runs.push(nameVars.slice(i, i + runlen));
    }
}
// get a list of all run sizes
let sizeRuns = [];
for (let runlen = 1; runlen < sizeVars.length; runlen++) {
    for (let i = 0; i < sizeVars.length - runlen; i++) {
        sizeRuns.push(sizeVars.slice(i, i + runlen));
    }
}

// make sure runs can never sum to be too much
const numRuns = runs.length;
for (let i = 0; i < rooms.length; i++) {
    const roomBits = Logic.constantBits(i);
    const roomCapacityBits = Logic.constantBits(rooms[i].capacity);

    for (let j = 0; j < numRuns; j++) {
        const run = runs[j];
        const sizeRun = sizeRuns[j];
        const start = run[0];
        const end = run[run.length - 1];

        solver.require(
            Logic.implies(
                Logic.and(
                    Logic.equalBits(start, end),
                    Logic.equalBits(start, roomBits)
                ),
                Logic.lessThanOrEqual(Logic.sum(sizeRun), roomCapacityBits)
            )
        );
    }
}

const endTime = new Date();

console.log("rules added", endTime.getTime() - beginTime.getTime());

// print the result
let soln = solver.solve();
for (let name of nameVars) {
    console.log(name, soln.evaluate(name));
}
*/

export { SplitRooms };
