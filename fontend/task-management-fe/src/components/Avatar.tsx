import React from "react";

interface AvatarProps {
    url?: string,
    fullname: string,
    className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({url, fullname, className}) => {
    const sizeClasses = className || 'h-10 w-10';
    return (
        <img
            title={fullname}
            src={url || `https://ui-avatars.com/api/?name=${fullname}&background=random&color=fff&rounded=true`}
            alt={fullname || 'Avatar'}
            className={`${sizeClasses}`}
        />
    )
}