import { createContext, useContext, useState, ReactNode } from 'react';

interface EditableElement {
  sectionId: string;
  elementType: 'text' | 'image' | 'button' | 'section';
  elementId?: string;
  content?: string;
}

interface EditableWebsiteContextType {
  isEditable: boolean;
  selectedElement: EditableElement | null;
  setSelectedElement: (element: EditableElement | null) => void;
  updateContent: (content: string) => void;
  toolbarPosition: { x: number; y: number };
  setToolbarPosition: (pos: { x: number; y: number }) => void;
}

const EditableWebsiteContext = createContext<EditableWebsiteContextType | null>(null);

export function EditableWebsiteProvider({ 
  children, 
  isEditable = false 
}: { 
  children: ReactNode; 
  isEditable?: boolean;
}) {
  const [selectedElement, setSelectedElement] = useState<EditableElement | null>(null);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });

  const updateContent = (content: string) => {
    if (selectedElement) {
      // This will be handled by the builder component
      console.log('Update content:', content);
    }
  };

  return (
    <EditableWebsiteContext.Provider
      value={{
        isEditable,
        selectedElement,
        setSelectedElement,
        updateContent,
        toolbarPosition,
        setToolbarPosition,
      }}
    >
      {children}
    </EditableWebsiteContext.Provider>
  );
}

export function useEditableWebsite() {
  const context = useContext(EditableWebsiteContext);
  if (!context) {
    return {
      isEditable: false,
      selectedElement: null,
      setSelectedElement: () => {},
      updateContent: () => {},
      toolbarPosition: { x: 0, y: 0 },
      setToolbarPosition: () => {},
    };
  }
  return context;
}
