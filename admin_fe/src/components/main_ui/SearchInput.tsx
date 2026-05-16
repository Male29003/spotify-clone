import { SearchOutlined, CloseOutlined } from "@mui/icons-material";
import React, { useEffect, useState } from "react";

interface SearchInputProps {
    initialValue?: string;
    placeholder?: string
    onSubmit: (value: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ initialValue = "", placeholder, onSubmit }) => {
    const [searchInput, setSearchInput] = useState(initialValue);

    useEffect(() => {
        setSearchInput(initialValue);
    }, [initialValue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit((searchInput as string).trim());
    }

    const handleClear = () => {
        setSearchInput("");
        onSubmit("");
    }

    return (
        <form onSubmit={handleSubmit} className='flex items-center bg-panel border border-border/60 hover:border-border rounded-full px-4 py-2 min-w-[250px] transition-all focus-within:border-highlight focus-within:ring-2 focus-within:ring-highlight/20 shadow-sm'>
            <SearchOutlined className='text-text-sub mr-2' fontSize="small"/>
            <input
                type="text"
                className='bg-transparent w-full border-none outline-none text-sm text-text-main placeholder-text-sub/70 font-medium'
                placeholder={placeholder}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
            />
            
            {searchInput && (
                <button 
                    type="button" 
                    onClick={handleClear}
                    className="text-text-sub hover:text-text-main transition-colors flex items-center justify-center"
                >
                    <CloseOutlined fontSize="small" />
                </button>
            )}
        </form>
    );
}

export default SearchInput;