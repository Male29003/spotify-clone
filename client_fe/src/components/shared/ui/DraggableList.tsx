import React, { useRef, useState } from 'react'

interface DraggableListProps {
    items: any[];
    isEditable: boolean;
    onReorder: (newItems: any[]) => void;
    renderItem: (item: any, index: number, dragHandleProps: any) => React.ReactNode;
    keyExtractor: (item: any) => string;
}

const DraggableList: React.FC<DraggableListProps> = ({ 
    items, 
    isEditable, 
    onReorder, 
    renderItem, 
    keyExtractor 
}) => {
    // Dùng useref lưu index của item đang được kéo và index của item đang được kéo qua
    const dragItemIndex = useRef<number | null>(null);
    const dragOverIndex = useRef<number | null>(null);

    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

    // Lưu index của item dc user kéo
    const [activeHandleIndex, setActiveHandleIndex] = useState<number | null>(null);
    // Bắt đầu kéo
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        if(!isEditable) {
            e.preventDefault()
            return;
        }

        dragItemIndex.current = position;
        setDraggingIndex(position);

        if(e.dataTransfer){
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('text/html', '');
        }
    };
    // Kéo qua item khác
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        if(!isEditable) {
            return;
        }
        dragOverIndex.current = position;
    }
    // cbi thả
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if(e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move'
        }
    }
    // Khi thả
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if(!isEditable || dragItemIndex.current === null || dragOverIndex.current === null) 
            return;
        if (dragItemIndex.current === dragOverIndex.current) { 
            handleDragEnd();
            return
        }
        
        const copyList = [...items];
        const draggedItem = copyList[dragItemIndex.current]

        copyList.splice(dragItemIndex.current, 1);
        copyList.splice(dragOverIndex.current, 0, draggedItem);
        
        onReorder(copyList);
        handleDragEnd()
    }
    // Kết thúc kéo thả
    const handleDragEnd = () => {
        dragItemIndex.current = null;
        dragOverIndex.current = null;
        setDraggingIndex(null);
    }

    return (
        <div className="flex flex-col gap-4">
            {items.map((item, index) => {
                const dragHandleProps = {
                    onMouseDown: () => setActiveHandleIndex(index),
                    onMouseUp: () => setActiveHandleIndex(null),
                    onMouseLeave: () => setActiveHandleIndex(null),
                    onTouchStart: () => setActiveHandleIndex(index),
                    onTouchEnd: () => setActiveHandleIndex(null),
                    onTouchCancel: () => setActiveHandleIndex(null)
                }
                return(
                    <div
                        key={keyExtractor(item)}
                        draggable={isEditable && activeHandleIndex === index}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onDragEnd={handleDragEnd}
                        className={`transition-all duration-300 cursor-grab active:cursor-grabbing rounded
                            ${draggingIndex == index ? 'opacity-80 scale-[1.05] shadow-xl border border-highlight' : 'opacity-100'}
                        `}
                    >
                        {renderItem(item, index, dragHandleProps)}
                    </div>
                )
            })}
        </div>
    )
}

export default DraggableList;