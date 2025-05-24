"use client";
import React, { useState, useRef } from "react";
import { z } from "zod";
import { useDeepResearchStore } from "@/store/global-state";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, Database, BarChart3 } from "lucide-react";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ModelProvider, EmbeddingProvider } from "@/types/types";
import Image from "next/image";

const formSchema = z.object({
  input: z.string().min(2).max(200),
  modelProvider: z.enum(["groq", "google", "hybrid", "openai"]),
  embeddingProvider: z.enum(["openai", "google"]),
  useRAG: z.boolean().default(true),
  useVisualizations: z.boolean().default(false),
  visualizationType: z.enum(["mermaid", "chartjs", "d3", "all"]).default("mermaid"),
});

const UserInput = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadPreviewUrls, setUploadPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    setQuestions,
    setTopic,
    setSelectedProvider,
    selectedProvider,
    setSelectedEmbeddingProvider,
    selectedEmbeddingProvider,
    setUseRAG,
    useRAG,
    setUploadedImageData,
    visualizationOptions,
    setVisualizationOptions
  } = useDeepResearchStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      input: "",
      modelProvider: selectedProvider as "hybrid" | "groq" | "google" | "openai",
      embeddingProvider: selectedEmbeddingProvider,
      useRAG: useRAG,
      useVisualizations: visualizationOptions.enabled,
      visualizationType: visualizationOptions.type,
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setUploadedImages(prev => [...prev, ...newFiles]);

      const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
      setUploadPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));

    URL.revokeObjectURL(uploadPreviewUrls[index]);
    setUploadPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      setSelectedProvider(values.modelProvider as ModelProvider);
      setSelectedEmbeddingProvider(values.embeddingProvider as EmbeddingProvider);
      setUseRAG(values.useRAG);
      setVisualizationOptions({
        enabled: values.useVisualizations,
        type: values.visualizationType
      });

      console.log(`Setting provider to: ${values.modelProvider}`);
      console.log(`Setting embedding provider to: ${values.embeddingProvider}`);
      console.log(`RAG enabled: ${values.useRAG}`);
      console.log(`Visualizations enabled: ${values.useVisualizations} (type: ${values.visualizationType})`);

      const imageData: { base64: string, name: string, type: string }[] = [];

      if (uploadedImages.length > 0) {
        for (const file of uploadedImages) {
          const base64 = await fileToBase64(file);
          imageData.push({
            base64,
            name: file.name,
            type: file.type
          });
        }
      }

      setUploadedImageData(imageData);

      const response = await fetch("/api/ask-queries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: values.input,
          modelProvider: values.modelProvider,
          embeddingProvider: values.embeddingProvider,
          useRAG: values.useRAG,
          useVisualizations: values.useVisualizations,
          visualizationType: values.visualizationType,
          hasImages: imageData.length > 0
        }),
      });

      const data = await response.json();
      setTopic(values.input);
      setQuestions(data);

      form.reset({
        input: "",
        modelProvider: values.modelProvider,
        embeddingProvider: values.embeddingProvider,
        useRAG: values.useRAG,
        useVisualizations: values.useVisualizations,
        visualizationType: values.visualizationType,
      });

      setUploadedImages([]);
      setUploadPreviewUrls([]);
    } catch (error) {
      console.error("Error submitting research topic:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 w-full max-w-4xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <FormField
            control={form.control}
            name="input"
            render={({ field }) => (
              <FormItem className="flex-1 w-full">
                <FormControl>
                  <Input
                    placeholder="Enter your research topic"
                    {...field}
                    className="rounded-full w-full p-4 py-6 text-white bg-white/70 backdrop-blur-sm border-black/10 shadow-sm"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <Button
              type="button"
              onClick={triggerFileInput}
              variant="outline"
              className="rounded-full h-12 px-4 flex-1 sm:flex-none bg-white/70"
              disabled={isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              <span className="sm:inline">Add Images</span>
            </Button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*"
              multiple
            />

            <Button
              type="submit"
              className="rounded-full h-12 px-6 flex-1 sm:flex-none"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </div>
        </div>

        {/* Image previews */}
        {uploadedImages.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-1">
            {uploadPreviewUrls.map((url, index) => (
              <div key={index} className="relative group">
                <div className="h-20 w-20 rounded-lg bg-gray-100 overflow-hidden relative shadow-sm">
                  <Image
                    src={url}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-1 opacity-70 hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 rounded-xl bg-white/50 backdrop-blur-sm p-5 border border-black/5 shadow-sm">
          <FormField
            control={form.control}
            name="modelProvider"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-600 mb-1 block">Chat Model</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="rounded-lg bg-white/80 h-10 border-black/5">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hybrid">Hybrid (Recommended)</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="groq">Groq</SelectItem>
                      <SelectItem value="google">Google Gemini</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="embeddingProvider"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-600 mb-1 block">Embedding Model</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="rounded-lg bg-white/80 h-10 border-black/5">
                      <SelectValue placeholder="Select embedding" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="useRAG"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between space-y-0 h-10 mt-6">
                <div className="space-y-0.5">
                  <FormLabel className="text-xs font-medium text-gray-600">
                    <div className="flex items-center">
                      Knowledge Base
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Database className="h-3 w-3 ml-1 text-gray-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-[200px] text-xs">
                              Enhance research with previously stored knowledge
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormField
              control={form.control}
              name="useVisualizations"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-y-0 h-6 mt-2">
                  <div className="space-y-0.5">
                    <FormLabel className="text-xs font-medium text-gray-600">
                      <div className="flex items-center">
                        Visualizations
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <BarChart3 className="h-3 w-3 ml-1 text-gray-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-[200px] text-xs">
                                Include diagrams and charts in the report
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch("useVisualizations") && (
              <FormField
                control={form.control}
                name="visualizationType"
                render={({ field }) => (
                  <FormItem className="mt-2">
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="rounded-lg bg-white/80 text-xs h-8 border-black/5">
                          <SelectValue placeholder="Chart Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mermaid">Diagrams (Mermaid)</SelectItem>
                          <SelectItem value="chartjs">Charts.js</SelectItem>
                          <SelectItem value="d3">D3 Graphics</SelectItem>
                          <SelectItem value="all">All Types</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        {(uploadedImages.length > 0 || form.watch("useRAG") || form.watch("useVisualizations")) && (
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            {uploadedImages.length > 0 && (
              <Badge variant="outline" className="flex items-center gap-1 bg-white/60 px-3 py-1 text-xs text-black">
                <Upload className="h-3 w-3" />
                {uploadedImages.length} image{uploadedImages.length > 1 ? 's' : ''}
              </Badge>
            )}

            <Badge variant="outline" className="bg-white/60 px-3 py-1 text-xs capitalize text-black">
              {form.watch("modelProvider")}
            </Badge>

            {form.watch("useRAG") && (
              <Badge variant="outline" className="flex items-center gap-1 bg-white/60 px-3 py-1 text-xs text-black">
                <Database className="h-3 w-3" />
                Knowledge Base
              </Badge>
            )}

            {form.watch("useVisualizations") && (
              <Badge variant="outline" className="flex items-center gap-1 bg-white/60 px-3 py-1 text-xs text-black">
                <BarChart3 className="h-3 w-3" />
                {form.watch("visualizationType") === "all" ? "All Visuals" : form.watch("visualizationType")}
              </Badge>
            )}
          </div>
        )}
      </form>
    </Form>
  );
};

export default UserInput;