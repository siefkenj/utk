import React, { Component } from "react";
import {
    TextField,
    List,
    ListItem,
    Button,
    Icon,
    //    Typography,
    Avatar,
    ListItemText,
    ListItemAvatar,
    Tooltip,
    Dialog,
    DialogTitle,
    Tabs,
    Tab
} from "@material-ui/core";
import PropTypes from "prop-types";
//import { withStyles } from "material-ui/styles";
//import indigo from "material-ui/colors/indigo";
import deepPurple from "@material-ui/core/colors/deepPurple";
import { Courses } from "./utils.js";

const ident = function(x) {
    return x;
};

// Term-related components

class TermItem extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.state.dialogOpen = false;
    }

    static dateToSession(date = new Date()) {
        let month = date.getMonth();
        let year = date.getFullYear();
        switch (month) {
            case 0:
            case 1:
            case 2:
            case 3:
                return { term: "S", year: "" + (year - 1) + "/" + year };
            case 4:
            case 5:
            case 6:
            case 7:
                return { term: "SY", year: "" + (year - 1) + "/" + year };
            case 8:
            case 9:
            case 10:
            case 11:
            default:
                return { term: "F", year: "" + year + "/" + (year + 1) };
        }
    }

    _handleDialogClose = value => {
        this.setState({ dialogOpen: false });
        (this.props.onChange || ident)(value);
    };

    _getTermList = (numYears = 2) => {
        // return a list of terms. e.g. [{term: 'F', year: '2017/2018'}, {term: 'S', ...
        let currYear = parseInt((this.props.year || "2000").slice(0, 4), 10);
        let years = [];
        for (let i = -1; i <= numYears - 1; i++) {
            years.push("" + (currYear + i) + "/" + (currYear + i + 1));
        }
        let terms = ["F", "S", "Y", "SF", "SS", "SY"];
        let ret = [];
        for (let year of years) {
            for (let term of terms) {
                ret.push({ term, year });
            }
        }
        return ret;
    };

    _termToString(term) {
        switch (term) {
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

    _editTerm = () => {
        this.setState({ dialogOpen: true });
    };

    render() {
        const { editable, onClick, highlight, ...other } = this.props;
        let classNames = "";
        if (highlight) {
            classNames += " highlight term-item-container"
        }
        return (
            <div className={classNames}>
                <ListItem onClick={onClick} {...other}>
                    {editable && (
                        <Avatar>
                            <Button color="primary" onClick={this._editTerm}>
                                <Icon>edit</Icon>
                            </Button>
                        </Avatar>
                    )}
                    <ListItemText
                        primary={
                            <span>
                                <Icon className="inline-icon">date_range</Icon>
                                {this.props.year}
                            </span>
                        }
                        secondary={this._termToString(this.props.term)}
                    />
                </ListItem>
                <SessionSelectDialog
                    open={this.state.dialogOpen}
                    selectedValue={{
                        term: this.props.term,
                        year: this.props.year
                    }}
                    onClose={this._handleDialogClose}
                    sessions={this._getTermList()}
                />
            </div>
        );
    }
}
TermItem.propTypes = {
    editable: PropTypes.bool
};

class SessionSelectDialog extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.state.tabValue = null;
    }
    handleTabChange = (event, tabValue) => {
        this.setState({ tabValue });
    };

    handleClose = () => {
        this.props.onClose(this.props.selectedValue);
    };

    handleListItemClick = value => {
        this.props.onClose(value);
    };

    _getSessions = (session, selectedValue={}) => {
        let len = 1;
        if (session === "summer") {
            len = 2;
        }
        let filtered = (this.props.sessions || []).filter(
            x => x.term.length === len
        );
        return filtered.map(({ term, year }, index) => (
            <TermItem
                button
                term={term}
                year={year}
                key={index}
                onClick={() => this.handleListItemClick({ term, year })}
                highlight={ (term === selectedValue.term && year === selectedValue.year) || undefined }
            />
        ));
    };

    render() {
        const { classes, onClose, selectedValue, ...other } = this.props;
        let tabValue = this.state.tabValue;
        if (tabValue === null) {
            // term will be 2 chars long if it is a summer session otherwise
            // one char long
            tabValue = (selectedValue.term || "F").length === 1 ? 0 : 1;
        }

        return (
            <Dialog
                onClose={this.handleClose}
                aria-labelledby="simple-dialog-title"
                {...other}
            >
                <Tabs
                    value={tabValue}
                    onChange={this.handleTabChange}
                >
                    <Tab label="Standard" />
                    <Tab label="Summer" />
                </Tabs>
                <List>
                    {tabValue === 0 && this._getSessions("fall", selectedValue)}
                    {tabValue === 1 && this._getSessions("summer", selectedValue)}
                </List>
            </Dialog>
        );
    }
}

SessionSelectDialog.propTypes = {
    onClose: PropTypes.func
};

// Course-realted components

class CourseCode extends Component {
    _splitName = name => {
        // separate the course code from the rest of the information (e.g, turn MAT135H1 into [MAT135, H1]
        return [name.slice(0, 6), name.slice(6)];
    };
    render() {
        const [main, secondary] = this._splitName(this.props.code);
        return (
            <span>
                <span className="coursecode-main">{main}</span>
                <span className="coursecode-secondary">{secondary}</span>
            </span>
        );
    }
}

class CourseItem extends Component {
    render() {
        const iconStyle = {
            verticalAlign: "middle",
            marginLeft: "12px"
        };
        const textStyle = {
            position: "relative",
            paddingLeft: "8px",
            paddingRight: "16px",
            verticalAlign: "middle",
            letterSpacing: "0px"
        };

        const { onClick, ...other } = this.props;
        return (
            <ListItem onClick={onClick || ident} {...other}>
                <Tooltip
                    title={
                        <div>
                            <div>Lecture Sections: {this.props.info.lec}</div>
                            <div>Tutorial Sections: {this.props.info.tut}</div>
                            <div>Students: {this.props.info.students}</div>
                        </div>
                    }
                >
                    <ListItemAvatar>
                        <Avatar style={{ backgroundColor: deepPurple[300] }}>
                            <Icon>school</Icon>
                        </Avatar>
                    </ListItemAvatar>
                </Tooltip>
                <ListItemText
                    primary={<CourseCode code={this.props.course} />}
                    secondary={
                        <span className="course-stats">
                            <Icon style={iconStyle}>location_city</Icon>
                            <span style={textStyle}>{this.props.info.lec}</span>
                            <Icon style={iconStyle}>edit</Icon>
                            <span style={textStyle}>{this.props.info.tut}</span>
                            <Icon style={iconStyle}>people</Icon>
                            <span style={textStyle}>
                                {this.props.info.students}
                            </span>
                        </span>
                    }
                />
                <List style={{ flex: "0 1 auto" }}>
                    {this.props.term && (
                        <TermItem
                            term={this.props.term}
                            year={this.props.year}
                        />
                    )}
                </List>
            </ListItem>
        );
    }
}

class CourseSelect extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.state.courseCode = "";
        this.state.showList = false;
    }

    _getCourseInfo = () => {
        let { term, year } = this.props;
        let session = { term, year };
        let course = this.state.courseCode;
        this.coursesInfo = new Courses();
        this.coursesInfo.fetch({ session, course }).then(courses => {
            if (courses.length > 0) {
                this.setState({ courseInfo: courses });
                this.setState({ showList: true });
            }
            console.log("promise", courses);
        });
    };

    _onSelected = course => {
        this.setState({
            showList: false,
            selectedCourse: course
        });
        if (this.props.onChange) {
            this.props.onChange(course);
        }
    };

    _onKeyPress = event => {
        if (event.key === "Enter") {
            this._getCourseInfo();
        }
    };

    render() {
        const selectedCourse = this.state.selectedCourse;
        // eslint-disable-next-line
        const { onChange, ...other } = this.props;
        return (
            <div>
                <TextField
                    label="Course Code"
                    value={this.state.courseCode}
                    onChange={event =>
                        this.setState({
                            courseCode: event.target.value.toUpperCase()
                        })
                    }
                    onKeyPress={this._onKeyPress}
                />
                <Button variant="contained" onClick={this._getCourseInfo}>
                    Search
                </Button>
                <CourseSelectDialog
                    courseInfo={this.state.courseInfo || []}
                    open={this.state.showList}
                    onClose={this._onSelected}
                />
                {selectedCourse && (
                    <CourseItem
                        term={this.props.term}
                        year={this.props.year}
                        course={selectedCourse.courseCode}
                        info={selectedCourse}
                    />
                )}
            </div>
        );
    }
}

class CourseSelectDialog extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    handleClose = () => {
        this.props.onClose(this.props.selectedValue);
    };

    handleListItemClick = value => {
        this.props.onClose(value);
    };

    render() {
        const { courseInfo, onClose, selectedValue, ...other } = this.props;

        return (
            <Dialog
                onClose={this.handleClose}
                aria-labelledby="simple-dialog-title"
                {...other}
            >
                <DialogTitle>Choose Course</DialogTitle>
                <List>
                    {(this.props.courseInfo || []).map((info, key) => {
                        return (
                            <CourseItem
                                term={this.props.term}
                                year={this.props.year}
                                button={true}
                                course={info.courseCode}
                                info={info}
                                key={key}
                                onClick={event => {
                                    this.handleListItemClick(info);
                                }}
                            />
                        );
                    })}
                </List>
            </Dialog>
        );
    }
}

export { TermItem, CourseItem, CourseSelect };
