import React from "react";
import { getFeatureFlag, setFeatureFlag } from "../common/storage";

// there's a weird bundling error on firefox when importing React, {useState}
// so use React.useState

export default function FeatureFlagSwitch({ featureFlagKey, children }) {
    const [state, setState] = React.useState(null);
    React.useEffect(async () => {
        const newState = await getFeatureFlag(featureFlagKey);
        setState(newState);
    }, []);
    function toggleStateLocalFirst() {
        setState(!state);
        setFeatureFlag(featureFlagKey, !state);
    }

    return (
        <div className="flex">
            <p className="mr-2">{children}</p>
            <div class="switch">
                <input
                    type="checkbox"
                    id={featureFlagKey}
                    class="switch__input"
                    checked={state}
                    onChange={toggleStateLocalFirst}
                />
                <label for={featureFlagKey} class="switch__label"></label>
            </div>
        </div>
    );
}
