import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Film, Image, ListVideo, ArrowRight, Layers, Zap, CheckCircle2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';

const tools = [
  {
    path: '/merge',
    label: 'Merge Videos',
    icon: Film,
    description: 'Combine multiple videos into a single seamless output',
  },
  {
    path: '/image-to-video',
    label: 'Images to Video',
    icon: Image,
    description: 'Convert images with custom durations into video',
  },
  {
    path: '/playlist',
    label: 'Playlist Compiler',
    icon: ListVideo,
    description: 'Build deterministic playlists and compile to video segments',
  },
];

const keyInsights = [
  {
    title: 'Deterministic Content',
    description: 'Static, scheduled, and repeatable content should be pre-compiled for reliability.',
    icon: Layers,
  },
  {
    title: 'Gapless Playback',
    description: 'Eliminate timing gaps, buffering, and codec issues at runtime.',
    icon: Zap,
  },
  {
    title: 'Exception Isolation',
    description: 'Dynamic content exists as explicit exceptions, not architecture constraints.',
    icon: CheckCircle2,
  },
];

export default function Landing() {
  const navigate = useNavigate();

  const scrollToAbout = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      <Toaster position="top-center" richColors />

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        </div>

        <div className="container max-w-5xl relative z-10 py-12">
          {/* Header badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-sm text-muted-foreground">
              <Film className="w-4 h-4 text-primary" />
              Deterministic Playlist Compilation
            </div>
          </motion.div>

          {/* Main title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="gradient-text">Compile Playlists</span>
              <br />
              <span className="text-foreground">Into Gapless Video</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Transform heterogeneous media playlists into predictable, gapless video artifacts. 
              Replace runtime orchestration with deterministic compilation.
            </p>
          </motion.div>

          {/* Tool Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-3 gap-4 mb-12"
          >
            {tools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <motion.button
                  key={tool.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  onClick={() => navigate(tool.path)}
                  className="group glass-panel rounded-2xl p-6 text-left transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_30px_hsl(175_80%_50%_/_0.15)]"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:from-primary/30 group-hover:to-secondary/30 transition-all">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {tool.label}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {tool.description}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Open tool <ArrowRight className="w-4 h-4" />
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex justify-center"
          >
            <button
              onClick={scrollToAbout}
              className="flex flex-col items-center gap-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <span className="text-sm">Learn more</span>
              <ChevronDown className="w-5 h-5 animate-bounce" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 border-t border-border/30">
        <div className="container max-w-4xl">
          {/* Core Observation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 gradient-text">
              Core Observation
            </h2>
            <div className="glass-panel rounded-2xl p-6 sm:p-8">
              <p className="text-muted-foreground leading-relaxed mb-4">
                Most digital signage systems treat playback as a runtime orchestration problem: a playlist of heterogeneous media items (images, videos, web pages, feeds) that must be sequenced, timed, and synchronized during playback. This introduces unnecessary complexity and failure modes—gaps, ordering issues, buffering delays, codec mismatches—especially for content that is static, scheduled, and repeatable.
              </p>
              <p className="text-foreground font-medium">
                Yet the majority of signage content is exactly that: deterministic and predictable.
              </p>
            </div>
          </motion.div>

          {/* Hypothesis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 gradient-text">
              Hypothesis
            </h2>
            <div className="glass-panel rounded-2xl p-6 sm:p-8 border-l-4 border-primary">
              <p className="text-muted-foreground leading-relaxed">
                If most signage content is deterministic, it should be possible—and preferable—to treat a playlist as a renderable timeline and compile it into one or more gapless videos ahead of time. Runtime playback would then become trivial, reliable, and platform-agnostic. Dynamic or interactive content should exist as explicit exceptions, not as constraints imposed on all content.
              </p>
            </div>
          </motion.div>

          {/* Key Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 gradient-text">
              Key Insights
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {keyInsights.map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <motion.div
                    key={insight.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-panel rounded-xl p-5"
                  >
                    <Icon className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-semibold text-foreground mb-2">{insight.title}</h3>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Implementation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 gradient-text">
              Implementation
            </h2>
            <div className="glass-panel rounded-2xl p-6 sm:p-8">
              <p className="text-muted-foreground leading-relaxed mb-4">
                To test this idea, this browser-based tool:
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Converts images (with per-item durations and layout settings) into video</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Merges videos using FFmpeg in the browser</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Allows users to create and reorder mixed-media playlists</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Analyzes playlists to identify contiguous renderable sections</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Splits the playlist at non-renderable items (e.g., webpages)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Renders each contiguous section into a single, gapless MP4 video</span>
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                When the entire playlist is renderable, the output is a single video. When exceptions exist, the system produces multiple section videos that can be played sequentially around live or interactive content.
              </p>
            </div>
          </motion.div>

          {/* Conceptual Reframing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 gradient-text">
              Conceptual Reframing
            </h2>
            <div className="glass-panel rounded-2xl p-6 sm:p-8">
              <p className="text-muted-foreground leading-relaxed mb-6">
                The system effectively behaves like a compiler:
              </p>
              <div className="grid sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">Input</div>
                  <div className="font-mono text-sm text-foreground">heterogeneous media + intent</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">IR</div>
                  <div className="font-mono text-sm text-foreground">deterministic timeline</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">Output</div>
                  <div className="font-mono text-sm text-foreground">gapless video artifacts</div>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed mt-6">
                This reframing clarifies design decisions, enables caching and incremental re-renders, and simplifies playback infrastructure.
              </p>
            </div>
          </motion.div>

          {/* Key Insight callout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-primary/30 bg-primary/5">
              <p className="text-lg text-foreground leading-relaxed mb-4 font-medium">
                This approach decisively outperforms classic playlist playback when content is:
              </p>
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">Deterministic</span>
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">Scheduled</span>
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">Repeatable</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                It only loses to classic playlists when content must remain live, conditional, or interactive. These cases are real but represent a minority and should not dictate the architecture for the majority.
              </p>
              <p className="text-foreground font-medium mt-4 italic">
                In other words: the exception should not define the rule.
              </p>
            </div>
          </motion.div>

          {/* Conclusion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 gradient-text">
              Conclusion
            </h2>
            <div className="glass-panel rounded-2xl p-6 sm:p-8">
              <p className="text-muted-foreground leading-relaxed mb-4">
                This project validates that pre-compiling playlists into deterministic video outputs is not only feasible but architecturally cleaner for most digital signage use cases. By isolating dynamic content as explicit exceptions, the system reduces complexity, increases reliability, and aligns tooling with how signage content is actually used.
              </p>
              <p className="text-foreground leading-relaxed">
                Just as importantly, the project served as a complete reasoning loop: identifying a problem, forming a hypothesis, building a system to test it, and arriving at a grounded conclusion.
              </p>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Button
              variant="glow"
              size="lg"
              onClick={() => navigate('/playlist')}
              className="group"
            >
              Try the Playlist Compiler
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="container max-w-4xl text-center text-sm text-muted-foreground/50">
          <p>Deterministic Playlist Compilation • Browser-based video processing</p>
        </div>
      </footer>
    </div>
  );
}
