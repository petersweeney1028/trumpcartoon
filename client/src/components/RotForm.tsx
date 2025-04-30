import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import ScriptEditor from "@/components/ScriptEditor";
import { apiRequest } from "@/lib/queryClient";

// Extend the schema to add validation rules
const formSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  trumpCaresAbout: z.string().min(1, "Please specify what Trump cares about"),
  zelenskyCaresAbout: z.string().min(1, "Please specify what Zelensky cares about"),
  vanceCaresAbout: z.string().min(1, "Please specify what JD Vance cares about"),
});

export type RotFormData = z.infer<typeof formSchema>;

interface RotFormProps {
  onSubmitSuccess: (rotId: string) => void;
}

interface ScriptData {
  trump1: string;
  zelensky: string;
  trump2: string;
  vance: string;
}

const RotForm = ({ onSubmitSuccess }: RotFormProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showScriptEditor, setShowScriptEditor] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<ScriptData | null>(null);
  const { toast } = useToast();

  const form = useForm<RotFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      trumpCaresAbout: "",
      zelenskyCaresAbout: "",
      vanceCaresAbout: "",
    },
  });

  const onGenerateScript = async (data: RotFormData) => {
    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/generate", data);
      const scriptData = await response.json();
      
      setGeneratedScript({
        trump1: scriptData.trump1,
        zelensky: scriptData.zelensky,
        trump2: scriptData.trump2,
        vance: scriptData.vance,
      });
      
      setShowScriptEditor(true);
      
      toast({
        title: "Script generated!",
        description: "You can now edit the lines before creating your rot",
      });
    } catch (error) {
      toast({
        title: "Error generating script",
        description: error instanceof Error ? error.message : "There was a problem generating your script",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const onCreateRot = async (scriptData: ScriptData) => {
    setIsCreating(true);
    try {
      const formData = form.getValues();
      
      const payload = {
        ...formData,
        ...scriptData,
      };
      
      const response = await apiRequest("POST", "/api/render", payload);
      const data = await response.json();
      
      toast({
        title: "Rot created!",
        description: "Your rot has been created successfully",
      });
      
      onSubmitSuccess(data.id);
    } catch (error) {
      toast({
        title: "Error creating rot",
        description: error instanceof Error ? error.message : "There was a problem creating your rot",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
      <h2 className="text-2xl font-heading font-bold text-dark mb-6">
        Create Your Rot
      </h2>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onGenerateScript)}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-dark font-medium">
                  What are they arguing about?
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., who gets the last Pop-Tart"
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Trump's values */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-gray-50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">
                  T
                </div>
                <h3 className="font-heading font-bold">Trump</h3>
              </div>
              <div className="p-4">
                <FormField
                  control={form.control}
                  name="trumpCaresAbout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-dark font-medium mb-2">
                        What does Trump care about?
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., winning"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Zelensky's values */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-gray-50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  Z
                </div>
                <h3 className="font-heading font-bold">Zelensky</h3>
              </div>
              <div className="p-4">
                <FormField
                  control={form.control}
                  name="zelenskyCaresAbout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-dark font-medium mb-2">
                        What does Zelensky care about?
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., international fairness"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* JD Vance's values */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-gray-50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                  V
                </div>
                <h3 className="font-heading font-bold">JD Vance</h3>
              </div>
              <div className="p-4">
                <FormField
                  control={form.control}
                  name="vanceCaresAbout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-dark font-medium mb-2">
                        What does JD Vance care about?
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Ohio values"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              type="submit"
              className="px-6 py-3 bg-secondary text-white font-bold rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Generate Script
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Script Editor */}
      {showScriptEditor && generatedScript && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <ScriptEditor 
            initialScript={generatedScript} 
            onSubmit={onCreateRot}
            isCreating={isCreating}
          />
        </div>
      )}
    </div>
  );
};

export default RotForm;