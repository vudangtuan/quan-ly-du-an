import {type ComponentType, createContext} from "react";

export interface MenuItem {
    id: string;
    label: string;
    icon?: ComponentType<any>;
    onClick?: () => void;
    disabled?: boolean;
    separator?: boolean;
    destructive?: boolean;
    shortcut?: string;
}

export interface MenuContextType {
    items: MenuItem[];
}

export const MenuContext = createContext<MenuContextType | undefined>(undefined);