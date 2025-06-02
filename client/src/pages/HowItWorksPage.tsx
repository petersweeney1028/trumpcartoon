const HowItWorksPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-heading font-bold mb-8">How ROT.CLUB Works</h1>
      
      <div className="prose prose-lg max-w-none">
        <h2 className="text-2xl font-bold mb-4">Technical Architecture & Implementation</h2>
        
        <p className="mb-6">
          ROT.CLUB is a full-stack multimedia platform that combines AI language models, voice synthesis, 
          video processing, and real-time web technologies to generate political cartoon dialogues. 
          Here's the technical breakdown:
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">Frontend Architecture</h2>
        
        <h3 className="text-xl font-bold mb-3">React + TypeScript Stack</h3>
        <ul className="mb-6">
          <li><strong>Vite</strong> development server with hot module replacement</li>
          <li><strong>Wouter</strong> for lightweight client-side routing</li>
          <li><strong>TanStack Query</strong> for server state management and caching</li>
          <li><strong>Tailwind CSS</strong> with shadcn/ui component library for responsive design</li>
          <li><strong>React Hook Form</strong> with Zod validation for type-safe form handling</li>
        </ul>

        <h3 className="text-xl font-bold mb-3">Video Player Implementation</h3>
        <p className="mb-6">Custom-built video player handling:</p>
        <ul className="mb-6">
          <li>Synchronized audio/video playback across multiple media sources</li>
          <li>Scene-based content loading with proper media state management</li>
          <li>Autoplay compliance and cross-browser compatibility</li>
          <li>Race condition prevention in media loading sequences</li>
        </ul>

        <h2 className="text-2xl font-bold mb-4 mt-8">Backend Services</h2>
        
        <h3 className="text-xl font-bold mb-3">Express.js API Server</h3>
        <ul className="mb-6">
          <li>RESTful API endpoints for content generation and retrieval</li>
          <li>Session management with express-session</li>
          <li>Static file serving for video and audio assets</li>
          <li>PostgreSQL database integration via Drizzle ORM</li>
        </ul>

        <h3 className="text-xl font-bold mb-3">Database Schema (PostgreSQL)</h3>
        <pre className="bg-gray-100 p-4 rounded mb-6 overflow-x-auto">
{`-- Users table for authentication
users (id, username, email, password_hash, created_at)

-- Remixes table for generated content
remixes (id, topic, script, clip_info, video_url, views, created_at)`}
        </pre>

        <h2 className="text-2xl font-bold mb-4 mt-8">AI Content Generation Pipeline</h2>
        
        <h3 className="text-xl font-bold mb-3">Script Generation (OpenAI GPT-4)</h3>
        <ul className="mb-6">
          <li>Structured prompts incorporating character personalities and political positions</li>
          <li>JSON schema validation for consistent dialogue format</li>
          <li>Context-aware generation based on user-defined topic and character perspectives</li>
          <li>Four-part dialogue structure: Trump → Zelensky → Trump → Vance</li>
        </ul>

        <h3 className="text-xl font-bold mb-3">Voice Synthesis (Fish.audio)</h3>
        <p className="mb-3">Character-specific voice models trained on authentic speech patterns:</p>
        <ul className="mb-6">
          <li>Trump: Model ID <code className="bg-gray-100 px-1">e58b0d7efca34eb38d5c4985e378abcb</code></li>
          <li>Zelensky: Model ID <code className="bg-gray-100 px-1">6be22288f35f4e9b964bdbeb099baee1</code></li>
          <li>Vance: Model ID <code className="bg-gray-100 px-1">86d3aee7cd9b4aab8cd8e54c3d35492b</code></li>
        </ul>
        <ul className="mb-6">
          <li>Argumentative delivery enhancement with 1.6x speaking rate</li>
          <li>Contextual prompting for heated debate tone</li>
        </ul>

        <h2 className="text-2xl font-bold mb-4 mt-8">Video Processing Pipeline</h2>
        
        <h3 className="text-xl font-bold mb-3">Python-based Video Composition</h3>
        <pre className="bg-gray-100 p-4 rounded mb-6 overflow-x-auto">
{`# FFmpeg integration for video/audio synchronization
ffmpeg -i video_clip.mp4 -i audio_track.mp3 -c:v copy -c:a aac -shortest output.mp4

# Video concatenation using concat demuxer
ffmpeg -f concat -safe 0 -i filelist.txt -c copy final_output.mp4`}
        </pre>

        <h3 className="text-xl font-bold mb-3">Asset Management</h3>
        <ul className="mb-6">
          <li>Static video clips stored in <code className="bg-gray-100 px-1">/static/clips/</code> (muted base animations)</li>
          <li>Generated audio files in <code className="bg-gray-100 px-1">/static/voices/</code> (character-specific TTS output)</li>
          <li>Final composed videos in <code className="bg-gray-100 px-1">/static/videos/</code> (complete remix files)</li>
        </ul>

        <h2 className="text-2xl font-bold mb-4 mt-8">Performance Optimizations</h2>
        
        <h3 className="text-xl font-bold mb-3">Client-Side</h3>
        <ul className="mb-6">
          <li>Component-level code splitting</li>
          <li>Query caching and invalidation strategies</li>
          <li>Optimistic UI updates for content creation</li>
          <li>Lazy loading for video assets</li>
        </ul>

        <h3 className="text-xl font-bold mb-3">Server-Side</h3>
        <ul className="mb-6">
          <li>Connection pooling for database queries</li>
          <li>Static asset caching with proper HTTP headers</li>
          <li>Asynchronous processing for video generation</li>
          <li>Error boundaries and retry mechanisms</li>
        </ul>

        <h2 className="text-2xl font-bold mb-4 mt-8">Tech Stack Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <p><strong>Frontend:</strong> React, TypeScript, Vite, TanStack Query, Tailwind CSS</p>
            <p><strong>Backend:</strong> Node.js, Express, PostgreSQL, Drizzle ORM</p>
          </div>
          <div>
            <p><strong>AI Services:</strong> OpenAI GPT-4, Fish.audio TTS</p>
            <p><strong>Media Processing:</strong> FFmpeg, Python, MoviePy</p>
            <p><strong>Infrastructure:</strong> Replit deployment, environment-based configuration</p>
          </div>
        </div>

        <p className="text-gray-600 italic">
          This architecture enables rapid content generation while maintaining high-quality output 
          and responsive user experience across the entire multimedia pipeline.
        </p>
      </div>
    </div>
  );
};

export default HowItWorksPage;