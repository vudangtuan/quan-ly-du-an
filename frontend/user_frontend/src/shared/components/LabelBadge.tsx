import React from "react";
import type {LabelRequest, LabelResponse} from "@/shared/types";


interface LabelBadgeProps {
    label: LabelResponse | LabelRequest,
    childrenLeft?: React.ReactNode
    childrenRight?: React.ReactNode
    className?: string;
}

export const LabelBadge: React.FC<LabelBadgeProps> = ({label, childrenLeft, childrenRight, className}) => {
    if (label == null) {
        return;
    }
    return (

        <span
            className={`px-2.5 flex items-center justify-center
             gap-1 py-1 rounded-md text-xs font-medium shadow-sm ${className}`}
            style={{
                backgroundColor: `${label.color}20`,
                color: label.color,
                border: `1px solid ${label.color}40`
            }}
        >
            {childrenLeft}
            {label.name}
            {childrenRight}
        </span>
    );
}