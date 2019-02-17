import React, { Component } from "react";
//import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
//import SelectField from 'material-ui/SelectField';
import {
    AppBar,
    Drawer,
    MenuItem,
    IconButton,
    Button,
    Icon,
    Toolbar,
    Typography
} from "@material-ui/core";
import PropTypes from "prop-types";
import CssBaseline from "@material-ui/core/CssBaseline";

import { Route, Link, HashRouter } from "react-router-dom";

import { TermItem, CourseItem, CourseSelect } from "./Components.js";
import { SplitRooms } from "./SplitRooms.js";
import { AssignRoles } from "./AssignRoles.js";
import { CourseStats } from "./CourseStats.js";
//import moment from 'moment';
import "./App.css";
import "react-selectize/themes/index.css";

const ident = function(x) {
    return x;
};

class ButtonAppBar extends Component {
    render() {
        return (
            <div className="menubar-root">
                <AppBar position="static">
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            className="menubar-button"
                            onClick={this.props.onTitleClick || ident}
                        >
                            <Icon>menu</Icon>
                        </IconButton>
                        <Typography
                            type="title"
                            color="inherit"
                            className="menubar-title"
                            onClick={this.props.onTitleClick || ident}
                        >
                            uToronto Toolkit
                        </Typography>
                        <Button color="inherit">About</Button>
                    </Toolbar>
                </AppBar>
            </div>
        );
    }
}

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.state.rooms = [];
        this.state.drawerOpen = false;
        this.state.session = TermItem.dateToSession(new Date());
    }

    render() {
        const closeDrawer = () => this.setState({ drawerOpen: false });

        // Menu/home screen component
        class Home extends Component {
            render() {
                return (
                    <div>
                        <Link to="/" onClick={closeDrawer} className="menu-link">
                            <MenuItem>Home</MenuItem>
                        </Link>
                        <Link to="/SplitRooms" onClick={closeDrawer} className="menu-link">
                            <MenuItem>Split Midterm Rooms</MenuItem>
                        </Link>
                        <Link to="/CourseStats" onClick={closeDrawer} className="menu-link">
                            <MenuItem>Course Stats</MenuItem>
                        </Link>
                        <Link to="/AssignRoles" onClick={closeDrawer} className="menu-link">
                            <MenuItem>Assign Roles</MenuItem>
                        </Link>
                    </div>
                );
            }
        }

        return (
            <HashRouter>
                <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                    <CssBaseline />
                    <ButtonAppBar
                        onTitleClick={() => this.setState({ drawerOpen: true })}
                    />
                    <Drawer open={this.state.drawerOpen} onClose={closeDrawer}>
                        <Home />
                    </Drawer>

                    <Route path="/SplitRooms" component={SplitRooms} />
                    <Route path="/CourseStats" component={CourseStats} />
                    <Route path="/AssignRoles" component={AssignRoles} />
                    <Route exact path="/" component={Home} />
                </div>
            </HashRouter>
        );
    }
}

export default App;
