import React from 'react';

const ActionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className='flex flex-col gap-5 mx-5 w-full'>
            {children}
        </div>
    );
};
export default ActionHeader;