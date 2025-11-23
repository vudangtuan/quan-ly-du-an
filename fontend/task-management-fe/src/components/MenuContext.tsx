import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import React from 'react';
import {MoreVertical} from 'lucide-react';

export interface MenuItem {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
    divider?: boolean;
}



const MenuContent: React.FC<{ items: MenuItem[] }> = ({items}) => {
    return (
        <>
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    {item.divider ? (
                        <ContextMenuPrimitive.Separator className="h-px bg-gray-200 my-1"/>
                    ) : (
                        <ContextMenuPrimitive.Item
                            onClick={item.onClick}
                            disabled={item.disabled}
                            className={`
                                flex items-center gap-3 px-3 py-2 text-sm outline-none cursor-pointer
                                transition-colors rounded-sm
                                ${item.disabled
                                ? 'text-gray-400 cursor-not-allowed'
                                : item.danger
                                    ? 'text-red-600 hover:bg-red-50 focus:bg-red-50'
                                    : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100'
                            }
                            `}
                        >
                            {item.icon && (
                                <span className="flex-shrink-0">
                                    {item.icon}
                                </span>
                            )}
                            <span>{item.label}</span>
                        </ContextMenuPrimitive.Item>
                    )}
                </React.Fragment>
            ))}
        </>
    );
};

const DropdownMenuContent: React.FC<{ items: MenuItem[] }> = ({ items }) => {
    return (
        <>
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    {item.divider ? (
                        <DropdownMenuPrimitive.Separator className="h-px bg-gray-200 my-1" />
                    ) : (
                        <DropdownMenuPrimitive.Item
                            onClick={item.onClick}
                            disabled={item.disabled}
                            className={`
                                flex items-center gap-3 px-3 py-2 text-sm outline-none cursor-pointer
                                transition-colors rounded-sm
                                ${item.disabled
                                ? 'text-gray-400 cursor-not-allowed'
                                : item.danger
                                    ? 'text-red-600 hover:bg-red-50 focus:bg-red-50'
                                    : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100'
                            }
                            `}
                        >
                            {item.icon && (
                                <span className="flex-shrink-0">
                                    {item.icon}
                                </span>
                            )}
                            <span>{item.label}</span>
                        </DropdownMenuPrimitive.Item>
                    )}
                </React.Fragment>
            ))}
        </>
    );
};


interface ContextMenuProps {
    items: MenuItem[];
    children: React.ReactNode;
    trigger?: 'contextmenu' | 'click' | 'both';
    showButton?: boolean;
    buttonClassName?: string;
}


export const ContextMenu: React.FC<ContextMenuProps> = ({
                                                            items,
                                                            children,
                                                            trigger = 'both',
                                                            showButton = false,
                                                            buttonClassName = '',
                                                        }) => {
    // Chỉ right-click
    if (trigger === 'contextmenu') {
        return (
            <ContextMenuPrimitive.Root>
                <ContextMenuPrimitive.Trigger asChild>
                    {children}
                </ContextMenuPrimitive.Trigger>
                <ContextMenuPrimitive.Portal>
                    <ContextMenuPrimitive.Content
                        className="min-w-[220px] bg-white rounded-lg border border-gray-200 shadow-lg p-1 z-50"
                    >
                        <MenuContent items={items} />
                    </ContextMenuPrimitive.Content>
                </ContextMenuPrimitive.Portal>
            </ContextMenuPrimitive.Root>
        );
    }

    // Chỉ click button
    if (trigger === 'click' && showButton) {
        return (
            <DropdownMenuPrimitive.Root>
                <div className={"flex justify-between"}>
                    {children}
                    <DropdownMenuPrimitive.Trigger asChild>
                        <div className={"flex flex-col justify-center"}>
                            <button
                                className={`${buttonClassName} p-1 rounded-full cursor-pointer
                                            transition-colors`}
                                aria-label="Menu"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreVertical className="h-5 w-5 text-gray-600" />
                            </button>
                        </div>
                    </DropdownMenuPrimitive.Trigger>
                </div>
                <DropdownMenuPrimitive.Portal>
                    <DropdownMenuPrimitive.Content
                        className="min-w-[220px] bg-white rounded-lg border border-gray-200 shadow-lg p-1 z-50"
                        sideOffset={5}
                        align="end"
                    >
                        <DropdownMenuContent items={items} />
                    </DropdownMenuPrimitive.Content>
                </DropdownMenuPrimitive.Portal>
            </DropdownMenuPrimitive.Root>
        );
    }

    // Cả hai: right-click VÀ button
    if (trigger === 'both') {
        return (
            <ContextMenuPrimitive.Root>
                <ContextMenuPrimitive.Trigger asChild>
                    <div className="relative">
                        {children}
                        {showButton && (
                            <DropdownMenuPrimitive.Root>
                                <DropdownMenuPrimitive.Trigger asChild>
                                    <button
                                        className={`p-1 rounded-full hover:bg-gray-100 absolute
                                        cursor-pointer
                                                    ${buttonClassName}`}
                                        aria-label="Menu"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MoreVertical className="h-5 w-5 text-gray-600" />
                                    </button>
                                </DropdownMenuPrimitive.Trigger>
                                <DropdownMenuPrimitive.Portal>
                                    <DropdownMenuPrimitive.Content
                                        className="min-w-[220px] bg-white rounded-lg border border-gray-200 shadow-lg p-1 z-50"
                                        sideOffset={5}
                                        align="end"
                                    >
                                        <DropdownMenuContent items={items} />
                                    </DropdownMenuPrimitive.Content>
                                </DropdownMenuPrimitive.Portal>
                            </DropdownMenuPrimitive.Root>
                        )}
                    </div>
                </ContextMenuPrimitive.Trigger>
                <ContextMenuPrimitive.Portal>
                    <ContextMenuPrimitive.Content
                        className="min-w-[220px] bg-white rounded-lg border border-gray-200 shadow-lg p-1 z-50"
                    >
                        <MenuContent items={items} />
                    </ContextMenuPrimitive.Content>
                </ContextMenuPrimitive.Portal>
            </ContextMenuPrimitive.Root>
        );
    }
    return <>{children}</>;
};