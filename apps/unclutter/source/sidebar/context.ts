import type { UserInfo } from "@unclutter/library-components/dist/store/_schema";
import { createContext } from "react";

export const SidebarContext = createContext<{
    userInfo?: UserInfo;
}>({});
