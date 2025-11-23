// @ts-ignore
import {LabelResponse} from "@features/projects/types/project.types";
import React from "react";


interface LabelProps {
    label: LabelResponse,
    children?: React.ReactNode
}

export const Label: React.FC<LabelProps> = ({label, children}) => {
    if (label == null) {
        return;
    }
    return (
        <div className="flex items-center gap-2 flex-shrink-0">
                                    <span
                                        className="px-2.5 flex items-center justify-center gap-1 py-1 rounded-md text-xs font-medium shadow-sm"
                                        style={{
                                            backgroundColor: `${label.color}20`,
                                            color: label.color,
                                            border: `1px solid ${label.color}40`
                                        }}
                                    >
                                        {children}
                                        {label.name}
                                    </span>

        </div>
    );
}