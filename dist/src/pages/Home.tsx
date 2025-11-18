import Hero from "@/components/home/Hero";
import Services from "@/components/home/Services";
import Gallery from "@/components/home/Gallery";
import Reviews from "@/components/home/Reviews";
import Contact from "@/components/home/Contact";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div>
      <Hero />
      <Services />
      <Gallery />
      <Reviews />
      <Contact />
      
      {/* iOS Test Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Link href="/ios-test">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full shadow-lg">
            iOS App Preview
          </Button>
        </Link>
      </div>
    </div>
  );
}
