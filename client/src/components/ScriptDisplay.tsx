import { Script } from "@shared/schema";

interface ScriptDisplayProps {
  script: Script;
}

const CharacterAvatar = ({ character }: { character: string }) => {
  // Use different SVG avatar colors for each character
  let bgColor = "bg-blue-500";
  
  if (character === "Trump") {
    bgColor = "bg-red-500";
  } else if (character === "Zelensky") {
    bgColor = "bg-blue-500";
  } else if (character === "Vance") {
    bgColor = "bg-orange-500";
  }
  
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bgColor} text-white font-bold`}>
      {character.charAt(0)}
    </div>
  );
};

const ScriptDisplay = ({ script }: ScriptDisplayProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-heading font-bold text-dark mb-4">Script</h2>
      <div className="space-y-4">
        {/* Trump's first line */}
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <CharacterAvatar character="Trump" />
          </div>
          <div className="bg-gray-100 rounded-lg p-3 flex-grow">
            <div className="font-medium text-dark mb-1">Trump:</div>
            <p>"{script.trump1}"</p>
          </div>
        </div>

        {/* Zelensky's line */}
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <CharacterAvatar character="Zelensky" />
          </div>
          <div className="bg-gray-100 rounded-lg p-3 flex-grow">
            <div className="font-medium text-dark mb-1">Zelensky:</div>
            <p>"{script.zelensky}"</p>
          </div>
        </div>

        {/* Trump's second line */}
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <CharacterAvatar character="Trump" />
          </div>
          <div className="bg-gray-100 rounded-lg p-3 flex-grow">
            <div className="font-medium text-dark mb-1">Trump:</div>
            <p>"{script.trump2}"</p>
          </div>
        </div>

        {/* JD Vance's line */}
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <CharacterAvatar character="Vance" />
          </div>
          <div className="bg-gray-100 rounded-lg p-3 flex-grow">
            <div className="font-medium text-dark mb-1">JD Vance:</div>
            <p>"{script.vance}"</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptDisplay;
