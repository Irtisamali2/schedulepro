import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from 'wouter';
import { 
  Save, Eye, ArrowLeft, Plus, Trash2, GripVertical, 
  Image as ImageIcon, Type, Palette, Upload, Check, X,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WebsiteElement {
  id: string;
  type: 'text' | 'button' | 'image' | 'spacer' | 'reviews';
  content?: string;
  settings?: {
    fontSize?: string;
    fontWeight?: string;
    textColor?: string;
    textAlign?: string;
    backgroundColor?: string;
    padding?: string;
    margin?: string;
    borderRadius?: string;
    imageUrl?: string;
    altText?: string;
    buttonLink?: string;
    hoverColor?: string;
  };
}

interface WebsiteColumn {
  id: string;
  width: 'auto' | '1/2' | '1/3' | '2/3' | '1/4' | '3/4';
  elements: WebsiteElement[];
}

interface WebsiteSection {
  id: string;
  type: string;
  title?: string;
  content?: string;
  columns?: WebsiteColumn[];
  settings?: {
    backgroundColor?: string;
    backgroundImage?: string;
    textColor?: string;
    padding?: string;
  };
}

interface WebsiteData {
  title: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  sections: WebsiteSection[];
}

export default function WYSIWYGWebsiteBuilder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('clientId');

  const [websiteData, setWebsiteData] = useState<WebsiteData>({
    title: '',
    description: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    sections: []
  });

  const [selectedElement, setSelectedElement] = useState<{
    sectionId: string;
    columnId?: string;
    elementId?: string;
  } | null>(null);

  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [editingText, setEditingText] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [draggedSection, setDraggedSection] = useState<number | null>(null);
  const [showAddSection, setShowAddSection] = useState<number | null>(null);

  // Fetch client data
  const { data: clientData } = useQuery<any>({
    queryKey: [`/api/public/client/${clientId}`],
    enabled: !!clientId
  });

  // Fetch existing website
  const { data: existingWebsite } = useQuery<any>({
    queryKey: [`/api/client/${clientId}/website`],
    enabled: !!clientId
  });

  useEffect(() => {
    if (existingWebsite) {
      const sections = existingWebsite.sections 
        ? (typeof existingWebsite.sections === 'string' 
            ? JSON.parse(existingWebsite.sections) 
            : existingWebsite.sections)
        : [];
      
      setWebsiteData({
        title: existingWebsite.title || '',
        description: existingWebsite.description || '',
        primaryColor: existingWebsite.primaryColor || '#3B82F6',
        secondaryColor: existingWebsite.secondaryColor || '#10B981',
        sections
      });
    }
  }, [existingWebsite]);

  // Auto-save mutation
  const saveWebsiteMutation = useMutation({
    mutationFn: async (data: WebsiteData) => {
      const payload: any = {
        title: data.title,
        description: data.description,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        sections: JSON.stringify(data.sections)
      };

      // Only include client-specific data if it exists
      if (existingWebsite) {
        payload.heroImage = existingWebsite.heroImage || '';
        payload.contactInfo = existingWebsite.contactInfo || JSON.stringify({});
        payload.socialLinks = existingWebsite.socialLinks || JSON.stringify({});
        payload.showPrices = existingWebsite.showPrices ?? true;
        payload.allowOnlineBooking = existingWebsite.allowOnlineBooking ?? true;
        payload.isPublished = existingWebsite.isPublished ?? true;
        payload.subdomain = existingWebsite.subdomain || '';
      }

      const method = existingWebsite ? 'PUT' : 'POST';
      return await apiRequest(`/api/client/${clientId}/website`, method, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientId}/website`] });
      toast({
        title: "Saved",
        description: "Changes saved automatically",
      });
    }
  });

  // Auto-save when data changes
  const autoSaveTimeout = useRef<NodeJS.Timeout>();
  useEffect(() => {
    // Only auto-save if we have loaded initial data (prevent saving empty state on mount)
    if (existingWebsite && (websiteData.title || websiteData.sections.length > 0)) {
      clearTimeout(autoSaveTimeout.current);
      autoSaveTimeout.current = setTimeout(() => {
        saveWebsiteMutation.mutate(websiteData);
      }, 1000);
    }
    
    // Cleanup timeout on unmount
    return () => clearTimeout(autoSaveTimeout.current);
  }, [websiteData, existingWebsite]);

  const handleElementClick = (sectionId: string, columnId?: string, elementId?: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setToolbarPosition({ x: rect.left, y: rect.top - 60 });
    }
    setSelectedElement({ sectionId, columnId, elementId });
    setShowToolbar(true);
    setEditingText(false);
  };

  const updateElement = (updates: Partial<WebsiteElement>) => {
    if (!selectedElement) return;
    
    setWebsiteData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === selectedElement.sectionId
          ? {
              ...section,
              columns: section.columns?.map(column =>
                column.id === selectedElement.columnId
                  ? {
                      ...column,
                      elements: column.elements.map(element =>
                        element.id === selectedElement.elementId
                          ? { 
                              ...element, 
                              ...updates,
                              // Deep merge settings to prevent data loss
                              settings: updates.settings 
                                ? { ...element.settings, ...updates.settings }
                                : element.settings
                            }
                          : element
                      )
                    }
                  : column
              )
            }
          : section
      )
    }));
  };

  const addSection = (type: string, afterIndex: number) => {
    const newSection: WebsiteSection = {
      id: `section_${Date.now()}`,
      type,
      title: type === 'hero' ? 'Welcome to Our Business' : `${type.charAt(0).toUpperCase()}${type.slice(1)} Section`,
      content: 'Edit this content by clicking on it',
      columns: [{
        id: `column_${Date.now()}`,
        width: 'auto',
        elements: [{
          id: `element_${Date.now()}`,
          type: 'text',
          content: 'Click to edit this text'
        }]
      }],
      settings: {
        backgroundColor: type === 'hero' ? websiteData.primaryColor : '#FFFFFF',
        textColor: type === 'hero' ? '#FFFFFF' : '#000000',
        padding: '60px 20px'
      }
    };

    setWebsiteData(prev => {
      const newSections = [...prev.sections];
      newSections.splice(afterIndex + 1, 0, newSection);
      return { ...prev, sections: newSections };
    });
    setShowAddSection(null);
  };

  const deleteSection = (sectionId: string) => {
    setWebsiteData(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId)
    }));
    setShowToolbar(false);
    setSelectedElement(null);
  };

  const moveSection = (fromIndex: number, toIndex: number) => {
    setWebsiteData(prev => {
      const newSections = [...prev.sections];
      const [movedSection] = newSections.splice(fromIndex, 1);
      newSections.splice(toIndex, 0, movedSection);
      return { ...prev, sections: newSections };
    });
  };

  const renderElement = (element: WebsiteElement, sectionId: string, columnId: string) => {
    const isSelected = selectedElement?.elementId === element.id;
    
    const style: React.CSSProperties = {
      fontSize: element.settings?.fontSize || '16px',
      color: element.settings?.textColor,
      backgroundColor: element.settings?.backgroundColor,
      padding: element.settings?.padding,
      margin: element.settings?.margin,
      borderRadius: element.settings?.borderRadius,
      textAlign: element.settings?.textAlign as any,
      fontWeight: element.settings?.fontWeight,
      cursor: 'pointer',
      border: isSelected ? '2px solid #3B82F6' : '2px solid transparent',
      outline: 'none',
      minHeight: '24px'
    };

    switch (element.type) {
      case 'text':
        return (
          <div
            style={style}
            onClick={(e) => handleElementClick(sectionId, columnId, element.id, e)}
            onDoubleClick={() => setEditingText(true)}
            contentEditable={editingText && isSelected}
            suppressContentEditableWarning
            onBlur={(e) => {
              if (editingText) {
                updateElement({ content: e.currentTarget.textContent || '' });
                setEditingText(false);
              }
            }}
            data-testid={`text-element-${element.id}`}
          >
            {element.content || 'Click to edit'}
          </div>
        );
      
      case 'button':
        return (
          <button
            style={{
              ...style,
              backgroundColor: style.backgroundColor || websiteData.primaryColor,
              color: style.color || '#FFFFFF',
              padding: style.padding || '12px 24px',
              borderRadius: style.borderRadius || '6px',
              border: 'none',
              fontWeight: 'bold'
            }}
            onClick={(e) => handleElementClick(sectionId, columnId, element.id, e)}
            data-testid={`button-element-${element.id}`}
          >
            {element.content || 'Button'}
          </button>
        );
      
      case 'image':
        return element.settings?.imageUrl ? (
          <img
            src={element.settings.imageUrl}
            alt={element.settings.altText || ''}
            style={{
              ...style,
              maxWidth: '100%',
              height: 'auto'
            }}
            onClick={(e) => handleElementClick(sectionId, columnId, element.id, e)}
            data-testid={`image-element-${element.id}`}
          />
        ) : (
          <div
            style={{
              ...style,
              backgroundColor: '#F3F4F6',
              padding: '40px',
              textAlign: 'center'
            }}
            onClick={(e) => {
              handleElementClick(sectionId, columnId, element.id, e);
              setShowImageUpload(true);
            }}
            data-testid={`image-placeholder-${element.id}`}
          >
            <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">Click to add image</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation(`/client-dashboard?clientId=${clientId}`)}
            data-testid="back-button"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Website Builder</h1>
            <p className="text-sm text-gray-500">{clientData?.client?.businessName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(`/client-website/${clientId}`, '_blank')}
            data-testid="preview-button"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button 
            size="sm"
            onClick={() => saveWebsiteMutation.mutate(websiteData)}
            disabled={saveWebsiteMutation.isPending}
            data-testid="save-button"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveWebsiteMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Floating Toolbar */}
      {showToolbar && selectedElement && selectedElement.elementId && (
        <div
          className="fixed bg-white shadow-lg rounded-lg border border-gray-200 p-2 flex items-center gap-1 z-50"
          style={{ left: toolbarPosition.x, top: toolbarPosition.y }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingText(true)}
            data-testid="edit-text-button"
          >
            <Type className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowImageUpload(true)}
            data-testid="change-image-button"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          
          {/* Typography Controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const currentWeight = websiteData.sections.find(s => s.id === selectedElement.sectionId)
                ?.columns?.find(c => c.id === selectedElement.columnId)
                ?.elements.find(e => e.id === selectedElement.elementId)?.settings?.fontWeight;
              updateElement({ settings: { fontWeight: currentWeight === 'bold' ? 'normal' : 'bold' } });
            }}
            data-testid="bold-button"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateElement({ settings: { textAlign: 'left' } })}
            data-testid="align-left-button"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateElement({ settings: { textAlign: 'center' } })}
            data-testid="align-center-button"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateElement({ settings: { textAlign: 'right' } })}
            data-testid="align-right-button"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <Input
            type="color"
            value={websiteData.sections.find(s => s.id === selectedElement.sectionId)
                  ?.columns?.find(c => c.id === selectedElement.columnId)
                  ?.elements.find(e => e.id === selectedElement.elementId)?.settings?.textColor || '#000000'
            }
            onChange={(e) => updateElement({ settings: { textColor: e.target.value } })}
            className="w-12 h-8 p-0 border-0"
            data-testid="text-color-picker"
          />
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              deleteSection(selectedElement.sectionId);
            }}
            className="text-red-500 hover:text-red-700"
            data-testid="delete-section-button"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowToolbar(false);
              setSelectedElement(null);
            }}
            data-testid="close-toolbar-button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Main Editor Area */}
      <div className="max-w-7xl mx-auto py-8">
        <div className="bg-white shadow-sm">
          {/* Global Settings */}
          <div className="border-b border-gray-200 p-6 space-y-4">
            <div>
              <Label>Website Title</Label>
              <Input
                value={websiteData.title}
                onChange={(e) => setWebsiteData({ ...websiteData, title: e.target.value })}
                placeholder="Enter website title"
                data-testid="website-title-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Primary Color</Label>
                <Input
                  type="color"
                  value={websiteData.primaryColor}
                  onChange={(e) => setWebsiteData({ ...websiteData, primaryColor: e.target.value })}
                  data-testid="primary-color-input"
                />
              </div>
              <div>
                <Label>Secondary Color</Label>
                <Input
                  type="color"
                  value={websiteData.secondaryColor}
                  onChange={(e) => setWebsiteData({ ...websiteData, secondaryColor: e.target.value })}
                  data-testid="secondary-color-input"
                />
              </div>
            </div>
          </div>

          {/* Sections */}
          {websiteData.sections.map((section, index) => (
            <div key={section.id} className="relative">
              {/* Add Section Button */}
              <div
                className="relative h-12 flex items-center justify-center group hover:bg-blue-50 transition-colors"
                onMouseEnter={() => setShowAddSection(index - 1)}
                onMouseLeave={() => setShowAddSection(null)}
              >
                {showAddSection === index - 1 && (
                  <div className="absolute z-30 flex gap-2 bg-white shadow-lg rounded-lg p-2 border border-gray-200">
                    <Button size="sm" variant="outline" onClick={() => addSection('hero', index - 1)} data-testid={`add-hero-${index}`}>Hero</Button>
                    <Button size="sm" variant="outline" onClick={() => addSection('about', index - 1)} data-testid={`add-about-${index}`}>About</Button>
                    <Button size="sm" variant="outline" onClick={() => addSection('services', index - 1)} data-testid={`add-services-${index}`}>Services</Button>
                    <Button size="sm" variant="outline" onClick={() => addSection('contact', index - 1)} data-testid={`add-contact-${index}`}>Contact</Button>
                  </div>
                )}
                <Plus className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
              </div>

              {/* Section Content */}
              <div
                className={`relative border-2 ${selectedElement?.sectionId === section.id ? 'border-blue-500' : 'border-transparent'} transition-all`}
                style={{
                  backgroundColor: section.settings?.backgroundColor || '#FFFFFF',
                  color: section.settings?.textColor || '#000000',
                  padding: section.settings?.padding || '40px 20px'
                }}
                draggable
                onDragStart={() => setDraggedSection(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedSection !== null && draggedSection !== index) {
                    moveSection(draggedSection, index);
                    setDraggedSection(null);
                  }
                }}
                data-testid={`section-${section.id}`}
              >
                {/* Section Drag Handle */}
                <div className="absolute top-2 left-2 cursor-move opacity-0 hover:opacity-100 transition-opacity">
                  <GripVertical className="h-6 w-6 text-gray-400" />
                </div>

                {/* Section Title (Editable) */}
                {section.title && (
                  <h2
                    className="text-3xl font-bold mb-4 cursor-pointer border-2 border-transparent hover:border-blue-300 transition-all p-2"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const newTitle = e.currentTarget?.textContent || e.target?.textContent || '';
                      setWebsiteData(prev => ({
                        ...prev,
                        sections: prev.sections.map(s =>
                          s.id === section.id ? { ...s, title: newTitle } : s
                        )
                      }));
                    }}
                    data-testid={`section-title-${section.id}`}
                  >
                    {section.title}
                  </h2>
                )}

                {/* Columns and Elements */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.columns?.map(column => (
                    <div key={column.id} className="space-y-4">
                      {column.elements.map(element => (
                        <div key={element.id}>
                          {renderElement(element, section.id, column.id)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Final Add Section */}
          <div
            className="relative h-16 flex items-center justify-center group hover:bg-blue-50 transition-colors cursor-pointer"
            onMouseEnter={() => setShowAddSection(websiteData.sections.length - 1)}
            onMouseLeave={() => setShowAddSection(null)}
          >
            {showAddSection === websiteData.sections.length - 1 && (
              <div className="absolute z-30 flex gap-2 bg-white shadow-lg rounded-lg p-2 border border-gray-200">
                <Button size="sm" variant="outline" onClick={() => addSection('hero', websiteData.sections.length - 1)} data-testid="add-hero-end">Hero</Button>
                <Button size="sm" variant="outline" onClick={() => addSection('about', websiteData.sections.length - 1)} data-testid="add-about-end">About</Button>
                <Button size="sm" variant="outline" onClick={() => addSection('services', websiteData.sections.length - 1)} data-testid="add-services-end">Services</Button>
                <Button size="sm" variant="outline" onClick={() => addSection('contact', websiteData.sections.length - 1)} data-testid="add-contact-end">Contact</Button>
              </div>
            )}
            <Plus className="h-6 w-6 text-gray-400 group-hover:text-blue-500" />
            <span className="ml-2 text-gray-500 group-hover:text-blue-500">Add Section</span>
          </div>
        </div>
      </div>

      {/* Image Upload Dialog */}
      <Dialog open={showImageUpload} onOpenChange={setShowImageUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Upload Image File</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      updateElement({ settings: { imageUrl: reader.result as string } });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                data-testid="image-file-input"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={selectedElement?.elementId 
                  ? websiteData.sections.find(s => s.id === selectedElement.sectionId)
                      ?.columns?.find(c => c.id === selectedElement.columnId)
                      ?.elements.find(e => e.id === selectedElement.elementId)?.settings?.imageUrl || ''
                  : ''
                }
                onChange={(e) => updateElement({ settings: { imageUrl: e.target.value } })}
                data-testid="image-url-input"
              />
            </div>
            <Button onClick={() => setShowImageUpload(false)} className="w-full" data-testid="image-url-save">
              <Check className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
