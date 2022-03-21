import React from "react";

export default function Switch({ id, state, toggle, children }) {
    return (
        <div className="flex">
            <p className="mr-2">{children}</p>
            <div class="switch">
                <input
                    type="checkbox"
                    id={id}
                    class="switch__input"
                    checked={state}
                    onChange={toggle}
                />
                <label for={id} class="switch__label"></label>
            </div>
        </div>
    );
}
