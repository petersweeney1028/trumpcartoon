import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface ScriptData {
  trump1: string;
  zelensky: string;
  trump2: string;
  vance: string;
}

interface ScriptEditorProps {
  initialScript: ScriptData;
  onSubmit: (script: ScriptData) => void;
  isCreating: boolean;
}

const MAX_WORDS = 20;

const ScriptEditor = ({ initialScript, onSubmit, isCreating }: ScriptEditorProps) => {
  const [script, setScript] = useState<ScriptData>(initialScript);
  const [wordCounts, setWordCounts] = useState({
    trump1: countWords(initialScript.trump1),
    zelensky: countWords(initialScript.zelensky),
    trump2: countWords(initialScript.trump2),
    vance: countWords(initialScript.vance),
  });

  function countWords(text: string): number {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }

  const handleChange = (field: keyof ScriptData, value: string) => {
    setScript((prev) => ({ ...prev, [field]: value }));
    setWordCounts((prev) => ({
      ...prev,
      [field]: countWords(value),
    }));
  };

  const handleCreateRemix = () => {
    onSubmit(script);
  };

  const isOverWordLimit = Object.values(wordCounts).some((count) => count > MAX_WORDS);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-heading font-bold">Edit Your Script</h3>
        <div className="text-sm text-muted-foreground">
          <span>Maximum {MAX_WORDS} words per line</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Trump's first line */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">
              T
            </div>
            <span className="font-medium">Trump</span>
            <div className={`ml-auto text-xs ${wordCounts.trump1 > MAX_WORDS ? 'text-danger' : 'text-muted-foreground'}`}>
              <span className="font-mono">{wordCounts.trump1}</span>/{MAX_WORDS} words
            </div>
          </div>
          <div className="p-3">
            <Textarea
              id="trumpLine1"
              rows={2}
              value={script.trump1}
              onChange={(e) => handleChange('trump1', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
              placeholder="Enter Trump's first line..."
            />
          </div>
        </div>

        {/* Zelensky's line */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              Z
            </div>
            <span className="font-medium">Zelensky</span>
            <div className={`ml-auto text-xs ${wordCounts.zelensky > MAX_WORDS ? 'text-danger' : 'text-muted-foreground'}`}>
              <span className="font-mono">{wordCounts.zelensky}</span>/{MAX_WORDS} words
            </div>
          </div>
          <div className="p-3">
            <Textarea
              id="zelenskyLine"
              rows={2}
              value={script.zelensky}
              onChange={(e) => handleChange('zelensky', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
              placeholder="Enter Zelensky's line..."
            />
          </div>
        </div>

        {/* Trump's second line */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">
              T
            </div>
            <span className="font-medium">Trump</span>
            <div className={`ml-auto text-xs ${wordCounts.trump2 > MAX_WORDS ? 'text-danger' : 'text-muted-foreground'}`}>
              <span className="font-mono">{wordCounts.trump2}</span>/{MAX_WORDS} words
            </div>
          </div>
          <div className="p-3">
            <Textarea
              id="trumpLine2"
              rows={2}
              value={script.trump2}
              onChange={(e) => handleChange('trump2', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
              placeholder="Enter Trump's second line..."
            />
          </div>
        </div>

        {/* JD Vance's line */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
              V
            </div>
            <span className="font-medium">JD Vance</span>
            <div className={`ml-auto text-xs ${wordCounts.vance > MAX_WORDS ? 'text-danger' : 'text-muted-foreground'}`}>
              <span className="font-mono">{wordCounts.vance}</span>/{MAX_WORDS} words
            </div>
          </div>
          <div className="p-3">
            <Textarea
              id="vanceLine"
              rows={2}
              value={script.vance}
              onChange={(e) => handleChange('vance', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
              placeholder="Enter JD Vance's line..."
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <Button
          className="px-6 py-3 bg-success text-white font-bold rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
          onClick={handleCreateRemix}
          disabled={isCreating || isOverWordLimit}
        >
          {isCreating ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Creating...
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
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Create Remix
            </>
          )}
        </Button>
      </div>
    </>
  );
};

export default ScriptEditor;
