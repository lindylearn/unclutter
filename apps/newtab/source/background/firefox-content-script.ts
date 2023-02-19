import { listenForPageEvents } from "@unclutter/library-components/dist/common";

// Script injected into Uncluter Library pages to redirect messages to the background script
// This is only used for Firefox, on Chromium we can use externally_connectable

listenForPageEvents();
