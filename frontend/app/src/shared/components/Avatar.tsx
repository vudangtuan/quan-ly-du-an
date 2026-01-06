import React from "react";


interface AvatarProps {
    url?: string,
    fullName: string,
    userId?: string,
    className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({url, fullName, className}) => {
    const sizeClasses = className || 'h-10 w-10';

    return (
        <div className="relative inline-block">
            <img
                title={fullName}
                src={url || `https://ui-avatars.com/api/?name=${fullName}&background=random&color=fff&rounded=true`}
                alt={fullName || 'Avatar'}
                className={`${sizeClasses}`}
            />
        </div>
    )
}