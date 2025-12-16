import {MenuContext, type MenuItem} from './context_menu.types';
import React, {type ReactNode} from "react";
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

interface BaseMenuProps {
    items: MenuItem[];
    children: ReactNode;
}

export const ContextMenu: React.FC<BaseMenuProps> = ({items, children}) => {
    return (
        <MenuContext.Provider value={{items}}>
            <ContextMenuPrimitive.Root>
                <ContextMenuPrimitive.Trigger asChild>
                    {children}
                </ContextMenuPrimitive.Trigger>
                <ContextMenuPrimitive.Portal>
                    <ContextMenuPrimitive.Content
                        className="min-w-[200px] bg-white shadow-lg border border-gray-200"
                    >
                        <MenuItems items={items} type="context"/>
                    </ContextMenuPrimitive.Content>
                </ContextMenuPrimitive.Portal>
            </ContextMenuPrimitive.Root>
        </MenuContext.Provider>
    );
}


export const DropdownMenu: React.FC<BaseMenuProps> = ({items, children}) => {
    return (
        <MenuContext.Provider value={{items}}>
            <DropdownMenuPrimitive.Root>
                <DropdownMenuPrimitive.Trigger asChild>
                    {children}
                </DropdownMenuPrimitive.Trigger>
                <DropdownMenuPrimitive.Portal>
                    <DropdownMenuPrimitive.Content
                        className="min-w-[200px] bg-gray-50 shadow-lg border border-gray-200"
                        align="end"
                        sideOffset={5}
                    >
                        <MenuItems items={items} type="dropdown"/>
                    </DropdownMenuPrimitive.Content>
                </DropdownMenuPrimitive.Portal>
            </DropdownMenuPrimitive.Root>
        </MenuContext.Provider>
    );
};

interface MenuProps {
    items: MenuItem[];
    children: ReactNode;
    trigger?: ReactNode;
    enableContextMenu?: boolean;
    enableDropdown?: boolean;
}

export const Menu: React.FC<MenuProps> = ({
                                              items,
                                              children,
                                              trigger,
                                              enableContextMenu = true,
                                              enableDropdown = true,
                                          }) => {
    const content = (
        <div className="relative">
            {children}
            {enableDropdown && trigger && (
                <DropdownMenu items={items}>
                    {trigger}
                </DropdownMenu>
            )}
        </div>
    );

    if (enableContextMenu) {
        return (
            <ContextMenu items={items}>
                {content}
            </ContextMenu>
        );
    }

    return content;
};


interface MenuItemsProps {
    items: MenuItem[];
    type: 'context' | 'dropdown';
}

const MenuItems: React.FC<MenuItemsProps> = ({items, type}) => {
    const ItemComponent = type === 'context'
        ? ContextMenuPrimitive.Item
        : DropdownMenuPrimitive.Item;

    const SeparatorComponent = type === 'context'
        ? ContextMenuPrimitive.Separator
        : DropdownMenuPrimitive.Separator;
    return (
        <>
            {items.map((item) => (
                <React.Fragment key={item.id}>
                    {item.separator ? (
                        <SeparatorComponent className="h-px bg-gray-200"/>
                    ) : (
                        <ItemComponent
                            disabled={item.disabled}
                            className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md cursor-pointer outline-none 
                            hover:bg-gray-100 focus:bg-gray-100
                            disabled:opacity-50 disabled:cursor-not-allowed ${item.destructive && "text-red-600"}`}
                            onClick={() => {
                                item.onClick?.();
                            }}
                        >
                            {item.icon && <item.icon size={18}/>}
                            <span className="flex-1">{item.label}</span>
                            {item.shortcut && (
                                <span className="text-xs text-gray-500">
                                    {item.shortcut}
                                </span>
                            )}
                        </ItemComponent>
                    )}
                </React.Fragment>
            ))}
        </>
    );
};