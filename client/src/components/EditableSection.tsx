import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, Settings } from 'lucide-react';

interface EditableSectionProps {
  children: ReactNode;
  sectionId: string;
  sectionName: string;
  isEditable?: boolean;
  onDelete?: () => void;
  onSettings?: () => void;
  onDragStart?: (sectionId: string) => void;
  onDragOver?: (e: React.DragEvent, sectionId: string) => void;
  onDragEnd?: () => void;
  className?: string;
}

export default function EditableSection({
  children,
  sectionId,
  sectionName,
  isEditable = false,
  onDelete,
  onSettings,
  onDragStart,
  onDragOver,
  onDragEnd,
  className
}: EditableSectionProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!isEditable) {
    return <>{children}</>;
  }

  return (
    <div
      className={`relative group ${className || ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-section-id={sectionId}
      draggable={isEditable}
      onDragStart={() => onDragStart?.(sectionId)}
      onDragOver={(e) => onDragOver?.(e, sectionId)}
      onDragEnd={onDragEnd}
    >
      {/* Hover Overlay */}
      {isHovered && (
        <>
          <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none z-10" />
          
          {/* Section Controls */}
          <div className="absolute top-2 right-2 flex items-center gap-2 z-20">
            <div className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium">
              {sectionName}
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="cursor-move"
              data-testid={`drag-${sectionId}`}
            >
              <GripVertical className="h-4 w-4" />
            </Button>
            {onSettings && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onSettings}
                data-testid={`settings-${sectionId}`}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={onDelete}
                data-testid={`delete-${sectionId}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </>
      )}
      
      {children}
    </div>
  );
}
