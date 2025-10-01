import { useState, useRef, useEffect } from 'react';
import { useEditableWebsite } from '@/contexts/EditableWebsiteContext';

interface EditableTextProps {
  children: string;
  element: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  'data-testid'?: string;
  onUpdate?: (newText: string) => void;
  sectionId?: string;
  elementId?: string;
}

export default function EditableText({
  children,
  element: Element,
  className,
  'data-testid': dataTestId,
  onUpdate,
  sectionId,
  elementId
}: EditableTextProps) {
  const { isEditable, selectedElement, setSelectedElement, setToolbarPosition } = useEditableWebsite();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(children);
  const elementRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(children);
  }, [children]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditable) return;
    
    e.stopPropagation();
    
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      setToolbarPosition({ x: rect.left, y: rect.top - 60 });
      setSelectedElement({
        sectionId: sectionId || '',
        elementType: 'text',
        elementId: elementId || '',
        content: text
      });
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!isEditable) return;
    
    e.stopPropagation();
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (onUpdate && text !== children) {
      onUpdate(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setText(children);
      setIsEditing(false);
    }
  };

  if (!isEditable) {
    return (
      <Element className={className} data-testid={dataTestId}>
        {children}
      </Element>
    );
  }

  if (isEditing) {
    const isMultiline = Element === 'p';
    
    if (isMultiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`${className} border-2 border-blue-500 bg-white p-2 outline-none resize-none`}
          rows={3}
          data-testid={`${dataTestId}-input`}
        />
      );
    }
    
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`${className} border-2 border-blue-500 bg-white p-2 outline-none w-full`}
        data-testid={`${dataTestId}-input`}
      />
    );
  }

  const isSelected = selectedElement?.elementId === elementId;
  
  return (
    <Element
      ref={elementRef as any}
      className={`${className} ${isEditable ? 'cursor-pointer hover:outline hover:outline-2 hover:outline-blue-400 hover:outline-offset-2 transition-all' : ''} ${isSelected ? 'outline outline-2 outline-blue-500 outline-offset-2' : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      data-testid={dataTestId}
      title={isEditable ? 'Double-click to edit' : undefined}
    >
      {text}
    </Element>
  );
}
