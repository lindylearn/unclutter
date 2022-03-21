import React from "react";

export default function Switch({ id, state, toggle, text }) {
    return (
        <div className="flex">
            <div
                className="mr-1"
                dangerouslySetInnerHTML={{ __html: text }}
            ></div>
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
