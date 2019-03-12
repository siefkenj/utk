import React from "react";

// Like useState but for props. It will act like
// useState until `prop` changes, in which case it
// gets set back to `prop`.
// pass `force=true` to make sure the value matches the prop value
function useProp(prop, force = false) {
    const [propDefault, setPropDefault] = React.useState(prop);
    const [propVal, setPropVal] = React.useState(prop);

    if ((force && prop !== propVal) || prop !== propDefault) {
        setPropDefault(prop);
        setPropVal(prop);
    }

    return [propVal, setPropVal];
}

export { useProp };
