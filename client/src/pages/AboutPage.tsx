const AboutPage = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-heading font-bold mb-8">About ROT.CLUB</h1>
      
      <div className="text-foreground space-y-6 leading-relaxed">
        <p>
          I love media. I was a cinema studies minor (for like a semester), at one point wanted to be an actor, 
          and have definitely watched too much TV. When GPT first dropped in 2022, one of my very first thoughts was: 
          "This is going to completely change how we make and consume media."
        </p>

        <p>
          I wrote a bit about that here:{" "}
          <a 
            href="https://medium.com/@peter_sweeney/interesting-things-to-build-in-the-future-part-3-future-of-content-2e536eed6321" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Interesting Things to Build in the Future – Part 3: Future of Content
          </a>
        </p>

        <p>
          At the time, I was thinking about fanfiction. Specifically, how when the Minions franchise loosened up 
          its IP grip, it triggered a wave of memes and cultural moments that actually helped the movie. I started 
          imagining a future where movies and shows intentionally lean into that—letting fans remix, recreate, 
          and share their own versions of the stories using AI.
        </p>

        <p>
          That led to a bigger idea: a kind of new-age media company. Imagine Netflix meets Roblox—one high-quality, 
          canonical "season" that anchors an entire universe of remixes. Anyone could tweak the storyline, add scenes, 
          fork the timeline. Maybe the best remixes even get voted into the actual canon. A tighter feedback loop 
          between audience and creator.
        </p>

        <p>
          Obviously… massive project. And I am not exactly a 10x engineer.
        </p>

        <p>
          So I scoped it down. First to a South Park-style show with remixes built in. Still too big. Eventually, 
          I landed on this dumb little site. You get 21 seconds of Trump, Zelensky, and JD Vance arguing in a cartoon 
          White House. You tell the AI what they're arguing about. It writes a script. It slaps on some voices. 
          And you've made a tiny, weird cartoon.
        </p>

        <p>
          Is it good? No. The AI scripts are mid. The voice syncing is janky. It's super limited compared to what 
          I want this to become. But I had to put something out in the world. See if it resonates.
        </p>

        <p>
          So if you're here: mess around for a few minutes. Make a Rot. Share it with a friend. And if this space 
          is interesting to you—AI media, remix culture, next-gen storytelling—{" "}
          <a 
            href="https://x.com/peter_sweeney0" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            DM me on X
          </a>.
        </p>

        <p className="font-semibold text-lg">
          Let's make weirder stuff.
        </p>
      </div>
    </div>
  );
};

export default AboutPage;