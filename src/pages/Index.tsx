import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-inter">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold font-geist">
            Drawtir
          </Link>
          
          <nav className="hidden md:flex gap-8 text-sm font-medium font-geist">
            <Link to="/editor/new" className="text-muted-foreground hover:text-foreground transition-colors">
              Generate
            </Link>
            <Link to="/gallery" className="text-muted-foreground hover:text-foreground transition-colors">
              Templates
            </Link>
            <Link to="/documentation" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
          </nav>
          
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <Link to="/auth">
              <Button variant="outline" size="sm" className="font-geist">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 font-geist">
              Design Smarter
              <br />
              <span className="text-muted-foreground">with Drawtir</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 font-geist">
              Generate stunning layouts instantly and customize them with powerful edits.
            </p>
            
            {/* Search/Input Section */}
            <div className="max-w-2xl mx-auto mb-16">
              <div className="border border-border rounded-xl p-6 bg-card shadow-sm">
                <input
                  type="text"
                  placeholder="Create something beautiful..."
                  className="w-full bg-transparent text-lg outline-none mb-4 font-geist placeholder:text-muted-foreground"
                />
                <div className="flex gap-3 items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="font-geist text-xs">
                      ✨ Prompt Builder
                    </Button>
                    <Button variant="outline" size="sm" className="font-geist text-xs">
                      📎 Attach
                    </Button>
                    <Button variant="outline" size="sm" className="font-geist text-xs">
                      📋
                    </Button>
                  </div>
                  <Button size="sm" className="font-geist">
                    ↑
                  </Button>
                </div>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="border border-border rounded-xl p-6 bg-card shadow-sm">
                <div className="mb-4 text-4xl">💬</div>
                <h3 className="text-lg font-semibold mb-2 font-geist">Generate UI from Simple Prompts</h3>
                <p className="text-sm text-muted-foreground font-geist">
                  Describe your vision in plain English and watch Drawtir create professional interfaces instantly.
                </p>
              </div>
              
              <div className="border border-border rounded-xl p-6 bg-card shadow-sm">
                <div className="mb-4 text-4xl">📐</div>
                <h3 className="text-lg font-semibold mb-2 font-geist">Curated Template Library</h3>
                <p className="text-sm text-muted-foreground font-geist">
                  Browse our growing collection of professionally designed templates.
                </p>
              </div>
              
              <div className="border border-border rounded-xl p-6 bg-card shadow-sm">
                <div className="mb-4 text-4xl">💻</div>
                <h3 className="text-lg font-semibold mb-2 font-geist">Clean Code Output</h3>
                <p className="text-sm text-muted-foreground font-geist">
                  Every generated design comes with clean, production-ready code.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Browser Mockup with Embedded Designer */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="border border-border rounded-xl overflow-hidden shadow-lg bg-card">
            {/* Browser Chrome */}
            <div className="border-b border-border bg-muted/30 px-4 py-3 flex items-center gap-3">
              {/* Window Controls */}
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              
              {/* Address Bar */}
              <div className="flex-1 flex items-center gap-2 ml-4">
                <div className="flex-1 bg-background border border-border rounded-lg px-4 py-1.5 text-sm text-muted-foreground font-geist flex items-center gap-2">
                  <span className="text-xs">🔒</span>
                  <span>drawtir.app/editor</span>
                </div>
              </div>
            </div>
            
            {/* Iframe Content */}
            <div className="relative w-full" style={{ height: '600px' }}>
              <iframe
                src="/editor/new"
                className="w-full h-full border-0"
                title="Drawtir Designer"
              />
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="border-t border-dashed border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 font-geist">
                Design smarter, not harder
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto font-geist">
                I create AI-powered design tools and premium templates that help designers and developers build beautiful products faster.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="border border-dashed border-border rounded-lg p-6 text-center">
                <div className="text-3xl font-bold mb-1 font-geist">500+</div>
                <div className="text-sm text-muted-foreground font-geist">Photo sessions</div>
              </div>
              <div className="border border-dashed border-border rounded-lg p-6 text-center">
                <div className="text-3xl font-bold mb-1 font-geist">98%</div>
                <div className="text-sm text-muted-foreground font-geist">Happy clients</div>
              </div>
              <div className="border border-dashed border-border rounded-lg p-6 text-center">
                <div className="text-3xl font-bold mb-1 font-geist">15K+</div>
                <div className="text-sm text-muted-foreground font-geist">Photos delivered</div>
              </div>
              <div className="border border-dashed border-border rounded-lg p-6 text-center">
                <div className="text-3xl font-bold mb-1 font-geist">12+</div>
                <div className="text-sm text-muted-foreground font-geist">Years experience</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
