import React from "react";

export default function Switch({ id, state, toggle }) {
    return (
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
    );
}
