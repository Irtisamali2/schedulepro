import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { websiteTemplates } from '@/lib/websiteTemplates';
import { Check, Sparkles, ChevronRight } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface TemplateSelectorProps {
    clientId: string;
    currentTemplateId?: string;
}

export default function TemplateSelector({ clientId, currentTemplateId = 'default' }: TemplateSelectorProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Mutation to update template
    const updateTemplateMutation = useMutation({
        mutationFn: async (templateId: string) => {
            const response = await apiRequest(
                `/api/client/${clientId}/website`,
                'PUT',
                {
                    templateId: templateId
                }
            );
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/public/client/${clientId}/website`] });
            queryClient.invalidateQueries({ queryKey: [`/api/client/${clientId}/website`] });
            toast({
                title: "✨ Template Updated!",
                description: "Your website template has been changed successfully.",
            });
            setShowConfirmDialog(false);
            setSelectedTemplate(null);
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to update template. Please try again.",
                variant: "destructive",
            });
        }
    });

    const handleSelectTemplate = (templateId: string) => {
        if (templateId === currentTemplateId) {
            toast({
                title: "Already Active",
                description: "This template is currently in use.",
            });
            return;
        }

        setSelectedTemplate(templateId);
        setShowConfirmDialog(true);
    };

    const handleConfirmChange = () => {
        if (selectedTemplate) {
            updateTemplateMutation.mutate(selectedTemplate);
        }
    };

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                            Choose Your Template
                        </h2>
                    </div>
                    <p className="text-sm text-slate-500">
                        Professional designs tailored for your industry
                    </p>
                </div>

                {/* Template Cards */}
                <div className="space-y-4">
                    {websiteTemplates.map((template) => {
                        const isActive = currentTemplateId === template.id;

                        return (
                            <Card
                                key={template.id}
                                className={`group relative overflow-hidden transition-all duration-300 cursor-pointer ${isActive
                                        ? 'border-2 border-blue-500 shadow-lg shadow-blue-100/50 bg-gradient-to-br from-blue-50/50 via-white to-slate-50/30'
                                        : 'border border-slate-200 hover:border-slate-300 hover:shadow-md bg-white'
                                    }`}
                                onClick={() => handleSelectTemplate(template.id)}
                            >
                                {/* Active Template Badge */}
                                {isActive && (
                                    <div className="absolute top-3 right-3 z-20">
                                        <div className="flex items-center gap-1.5 bg-blue-600 text-white px-2.5 py-1 rounded-full shadow-lg">
                                            <Check className="h-3.5 w-3.5" />
                                            <span className="text-xs font-semibold">Active</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-4 p-4">
                                    {/* Template Preview Image */}
                                    <div className="flex-shrink-0 relative">
                                        <div
                                            className={`w-24 h-24 rounded-lg overflow-hidden border-2 transition-all duration-300 ${isActive
                                                    ? 'border-blue-400 shadow-md'
                                                    : 'border-slate-200 group-hover:border-slate-300 group-hover:shadow-sm'
                                                }`}
                                            style={{
                                                background: `linear-gradient(135deg, ${template.primaryColor}15 0%, ${template.secondaryColor}15 100%)`
                                            }}
                                        >
                                            {/* Icon/Preview */}
                                            <div className="w-full h-full flex items-center justify-center">
                                                <div
                                                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold shadow-sm"
                                                    style={{
                                                        backgroundColor: `${template.primaryColor}20`,
                                                        color: template.primaryColor
                                                    }}
                                                >
                                                    {template.id === 'default' ? '💇' : '🏠'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Color Indicators - Small Dots */}
                                        <div className="absolute -bottom-1 -right-1 flex gap-1">
                                            <div
                                                className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                                                style={{ backgroundColor: template.primaryColor }}
                                                title="Primary color"
                                            />
                                            <div
                                                className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                                                style={{ backgroundColor: template.secondaryColor }}
                                                title="Secondary color"
                                            />
                                        </div>
                                    </div>

                                    {/* Template Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-base text-slate-900 mb-1 flex items-center gap-2">
                                                    {template.name}
                                                    {isActive && (
                                                        <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                    )}
                                                </h3>
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 border-0 font-medium"
                                                >
                                                    {template.category}
                                                </Badge>
                                            </div>
                                        </div>

                                        <p className="text-sm text-slate-600 leading-relaxed mb-3 line-clamp-2">
                                            {template.description}
                                        </p>

                                        {/* Action Button */}
                                        <Button
                                            size="sm"
                                            variant={isActive ? "default" : "outline"}
                                            className={`w-full transition-all duration-300 ${isActive
                                                    ? 'shadow-md'
                                                    : 'group-hover:bg-slate-50'
                                                }`}
                                            style={
                                                isActive
                                                    ? {
                                                        backgroundColor: template.primaryColor,
                                                        borderColor: template.primaryColor,
                                                        color: "white"
                                                    }
                                                    : {}
                                            }
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectTemplate(template.id);
                                            }}
                                        >
                                            {isActive ? (
                                                <>
                                                    <Check className="mr-1.5 h-3.5 w-3.5" />
                                                    <span className="text-xs font-semibold">Currently Active</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-xs font-medium">Use This Template</span>
                                                    <ChevronRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Subtle gradient accent on hover for inactive templates */}
                                {!isActive && (
                                    <div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                        style={{
                                            background: `linear-gradient(135deg, ${template.primaryColor}03 0%, transparent 100%)`
                                        }}
                                    />
                                )}
                            </Card>
                        );
                    })}
                </div>

                {/* Info Footer */}
                <div className="text-center pt-2">
                    <p className="text-xs text-slate-400">
                        Switch templates anytime • Your content stays safe
                    </p>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-blue-600" />
                            Switch Template?
                        </DialogTitle>
                        <DialogDescription className="text-sm leading-relaxed">
                            Changing your template will update your website's design and layout.
                            Your content will be preserved.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-2">
                        <div className="flex gap-3">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                    <span className="text-amber-600 text-lg">⚠️</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-amber-900 mb-1">
                                    Important Notice
                                </p>
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    Switching templates will replace the current sections and layout.
                                    Make sure you've saved any important changes before proceeding.
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setShowConfirmDialog(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmChange}
                            disabled={updateTemplateMutation.isPending}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                            {updateTemplateMutation.isPending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Switching...
                                </>
                            ) : (
                                <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Confirm Switch
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
