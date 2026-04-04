import { Link } from 'react-router-dom';
import { Leaf, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Index() {
  const steps = [
    {
      number: "01",
      title: "Collection",
      description: "Farmers log GPS-tagged herb collections with quality notes, creating the genesis block.",
      image: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&q=80&w=600&h=400"
    },
    {
      number: "02",
      title: "Processing",
      description: "Processors record drying, grinding, and storage conditions in the immutable chain.",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRAnD97SzzVpip92ug-ACsGYiFtcINTFNr91A&s"
    },
    {
      number: "03",
      title: "Lab Testing",
      description: "Certified labs verify moisture, pesticide levels, purity, and DNA fingerprinting.",
      image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=600&h=400"
    },
    {
      number: "04",
      title: "Manufacturing",
      description: "Manufacturers combine verified batches and generate QR-linked product records.",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWHrCQA0mnru4MWH95mbNNuBs-xPcwxgZxzA&s"
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Navbar */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-[#10b981]" />
            <span className="font-bold text-xl text-gray-900 tracking-tight">HerbChain</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Home
            </Link>
            <button className="text-gray-400 hover:text-gray-600 border border-gray-200 rounded-md p-1.5 focus:outline-none">
              <Sun className="h-4 w-4" />
            </button>
            <Link to="/login" className="text-gray-600 hover:text-gray-900 ml-2">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="inline-flex items-center rounded-full border border-[#10b981]/20 bg-[#f0fdf4] px-3 py-1 text-sm font-medium text-[#10b981] mb-8">
              Blockchain-Verified Supply Chain
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
              From Soil to Shelf — <br />
              <span className="text-[#10b981]">Transparent & Verified</span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mb-10 leading-relaxed font-medium">
              HerbChain brings blockchain traceability to Ayurvedic herbs. Every batch is tracked from the forest floor through processing, lab testing, and manufacturing — with a QR code consumers can scan to verify authenticity.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-[#10b981] hover:bg-[#059669] text-white px-8 h-12 text-base font-semibold">
                  Get Started
                </Button>
              </Link>
              <Link to="/verify/ASHVITAL-001-2026">
                <Button variant="outline" size="lg" className="px-8 h-12 text-base font-semibold border-gray-200 text-gray-900 bg-white hover:bg-gray-50 shadow-sm">
                  Verify a Product
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features/Steps Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl relative">
            {/* Background connecting line hidden on mobile, visible on lg */}
            <div className="hidden lg:block absolute top-[120px] left-8 right-8 h-px bg-[#10b981]/20 -z-10" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
                  <div className="aspect-[4/3] rounded-lg overflow-hidden mb-6 bg-gray-100 flex-shrink-0">
                    <img 
                      src={step.image} 
                      alt={step.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <span className="text-4xl font-bold text-[#10b981] mb-2">{step.number}</span>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                    <p className="text-gray-500 leading-relaxed text-sm">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
