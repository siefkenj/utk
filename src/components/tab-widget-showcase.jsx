import React, { useEffect } from "react";
import { DragDropContext } from "react-beautiful-dnd";

import {
    CourseHeaderButton,
    CourseTableRow,
    SortableCourseTable,
} from "./course-table";
import { SessionDisplay, SessionSelectWide } from "./term-select";
import { Session } from "../libs/session-date";
import { useStoreState, useStoreActions } from "easy-peasy";
import { TAItem, TAList } from "./ta-display";
import { TASpreadsheet } from "./ta-spreadsheet";
import { CoursesSpreadsheet } from "./courses-spreadsheet";
import SplitPane from "react-split-pane";
import { SaveDataButton, LoadDataButton } from "./savers";

function TabWidgetShowcase(props) {
    return "Disabled";
}

export { TabWidgetShowcase };
