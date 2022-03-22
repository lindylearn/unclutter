import React from "react";
import {
    collectAnonymousMetricsFeatureFlag,
    getFeatureFlag,
    setFeatureFlag,
} from "../common/featureFlags";
import { reportEvent } from "../common/metrics";

// there's a weird bundling error on firefox when importing React, {useState}
// so use React.useState

export default function FeatureFlagSwitch({ featureFlagKey, children }) {
    const [state, setState] = React.useState(null);
    React.useEffect(async () => {
        const newState = await getFeatureFlag(featureFlagKey);
        setState(newState);
    }, []);
    async function toggleStateLocalFirst() {
        setState(!state);

        if (featureFlagKey === collectAnonymousMetricsFeatureFlag && state) {
            // report that metrics were disabled before applying new config (after that reportEvent no-nops)
            await reportEvent("disableMetrics");
        }

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
