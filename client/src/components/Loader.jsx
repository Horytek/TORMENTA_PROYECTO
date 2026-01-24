import React from 'react';
import { Spinner } from "@heroui/react";

const Loader = () => {
    return (
        <div className="flex justify-center items-center w-full h-[50vh]">
            <Spinner size="lg" />
        </div>
    );
};

export default Loader;
