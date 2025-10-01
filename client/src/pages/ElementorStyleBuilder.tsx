import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Save,
  Eye,
  Plus,
  Settings,
  Type,
  Image as ImageIcon,
  Palette,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  GripVertical,
  X
} from 'lucide-react';
import FigmaDesignedWebsite from '@/components/FigmaDesignedWebsite';
import { EditableWebsiteProvider } from '@/contexts/EditableWebsiteContext';

export default function ElementorStyleBuilder() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [clientId, setClientId] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [editingElement, setEditingElement] = useState<any>(null);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [editText, setEditText] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  
  // Get clientId from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('clientId');
    if (id) {
      setClientId(id);
    } else {
      toast({
        title: "Error",
        description: "No client ID provided",
        variant: "destructive"
      });
      navigate('/dashboard');
    }
  }, []);

  // Fetch client data
  const { data: client } = useQuery<{ businessName?: string }>({
    queryKey: [`/api/client/${clientId}`],
    enabled: !!clientId
  });

  // Fetch website data
  const { data: websiteData, isLoading } = useQuery<any>({
    queryKey: [`/api/client/${clientId}/website`],
    enabled: !!clientId
  });

  // Initialize sections from websiteData
  useEffect(() => {
    if (websiteData?.sections) {
      try {
        const parsedSections = JSON.parse(websiteData.sections);
        setSections(parsedSections);
      } catch (e) {
        console.error('Error parsing sections:', e);
        setSections([]);
      }
    }
  }, [websiteData]);

  // Save website mutation
  const saveWebsiteMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = websiteData?.id ? 'PUT' : 'POST';
      return await apiRequest(`/api/client/${clientId}/website`, method, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientId}/website`] });
      toast({
        title: "Saved!",
        description: "Your website has been updated successfully."
      });
    }
  });

  const handlePreview = () => {
    window.open(`/client-website/${clientId}`, '_blank');
  };

  const handleTextEdit = (element: any, currentText: string) => {
    setEditingElement(element);
    setEditText(currentText);
    setShowTextEditor(true);
  };

  const saveTextEdit = () => {
    // This will update the website data and trigger auto-save
    setShowTextEditor(false);
    toast({
      title: "Updated",
      description: "Text has been updated"
    });
  };

  const handleAddSection = (sectionType: string) => {
    const newSection = {
      id: `section_${Date.now()}`,
      type: sectionType,
      title: `New ${sectionType} Section`,
      content: 'Edit this content...',
      settings: {}
    };
    
    const updatedSections = [...sections, newSection];
    setSections(updatedSections);
    
    if (websiteData) {
      saveWebsiteMutation.mutate({
        ...websiteData,
        sections: JSON.stringify(updatedSections)
      });
    }
  };

  const handleDeleteSection = (sectionId: string) => {
    const updatedSections = sections.filter(s => s.id !== sectionId);
    setSections(updatedSections);
    
    if (websiteData) {
      saveWebsiteMutation.mutate({
        ...websiteData,
        sections: JSON.stringify(updatedSections)
      });
    }
  };

  if (!clientId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900" data-testid="builder-title">
            Website Builder
          </h1>
          <span className="text-sm text-gray-500">
            {client?.businessName || 'Loading...'}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handlePreview}
            data-testid="preview-button"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={() => websiteData && saveWebsiteMutation.mutate(websiteData)}
            disabled={saveWebsiteMutation.isPending}
            data-testid="save-button"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveWebsiteMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Settings Panel */}
        {showSidebar && (
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Website Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label>Website Title</Label>
                    <Input
                      value={websiteData?.title || ''}
                      onChange={(e) => {
                        if (websiteData) {
                          saveWebsiteMutation.mutate({
                            ...websiteData,
                            title: e.target.value
                          });
                        }
                      }}
                      placeholder="Enter website title"
                      data-testid="title-input"
                    />
                  </div>

                  <div>
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={websiteData?.primaryColor || '#9333ea'}
                        onChange={(e) => {
                          if (websiteData) {
                            saveWebsiteMutation.mutate({
                              ...websiteData,
                              primaryColor: e.target.value
                            });
                          }
                        }}
                        className="w-20 h-10"
                        data-testid="primary-color-picker"
                      />
                      <Input
                        value={websiteData?.primaryColor || '#9333ea'}
                        onChange={(e) => {
                          if (websiteData) {
                            saveWebsiteMutation.mutate({
                              ...websiteData,
                              primaryColor: e.target.value
                            });
                          }
                        }}
                        placeholder="#9333ea"
                        data-testid="primary-color-input"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={websiteData?.secondaryColor || '#ec4899'}
                        onChange={(e) => {
                          if (websiteData) {
                            saveWebsiteMutation.mutate({
                              ...websiteData,
                              secondaryColor: e.target.value
                            });
                          }
                        }}
                        className="w-20 h-10"
                        data-testid="secondary-color-picker"
                      />
                      <Input
                        value={websiteData?.secondaryColor || '#ec4899'}
                        onChange={(e) => {
                          if (websiteData) {
                            saveWebsiteMutation.mutate({
                              ...websiteData,
                              secondaryColor: e.target.value
                            });
                          }
                        }}
                        placeholder="#ec4899"
                        data-testid="secondary-color-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-semibold mb-3">Add Sections</h3>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleAddSection('hero')}
                    data-testid="add-hero-section"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Hero Section
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleAddSection('about')}
                    data-testid="add-about-section"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    About Section
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleAddSection('services')}
                    data-testid="add-services-section"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Services Section
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleAddSection('contact')}
                    data-testid="add-contact-section"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Contact Section
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Editor Area - Embedded Client Website */}
        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="max-w-[1920px] mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Loading website...</p>
              </div>
            ) : (
              <EditableWebsiteProvider isEditable={true}>
                <div 
                  className="relative"
                  data-testid="editable-website-container"
                >
                  {/* Render actual client website */}
                  <FigmaDesignedWebsite 
                    clientId={clientId} 
                    isBuilderPreview={true}
                    onDeleteSection={handleDeleteSection}
                    onEditSection={(sectionId) => {
                      toast({
                        title: "Edit Section",
                        description: `Editing ${sectionId} section`
                      });
                    }}
                  />
                  
                  {/* Editing overlay hints */}
                  <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg text-sm z-50">
                    Click on any element to edit • Drag sections to reorder
                  </div>
                </div>
              </EditableWebsiteProvider>
            )}
          </div>
        </div>
      </div>

      {/* Text Editor Dialog */}
      <Dialog open={showTextEditor} onOpenChange={setShowTextEditor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Text</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full min-h-[200px] p-3 border rounded-lg"
              data-testid="text-editor-textarea"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTextEditor(false)}
                data-testid="text-editor-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={saveTextEdit}
                data-testid="text-editor-save"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
