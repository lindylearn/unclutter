import React from "react";

export default function Switch() {
    return (
        <div class="flex items-center justify-center w-full mb-12">
            <label for="toggleB" class="flex items-center cursor-pointer">
                <div class="relative">
                    <input type="checkbox" id="toggleB" class="sr-only" />
                    <div class="block bg-gray-600 w-14 h-8 rounded-full"></div>
                    <div class="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition"></div>
                </div>
            </label>
        </div>
    );
}
