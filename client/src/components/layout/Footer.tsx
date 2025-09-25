import { Link } from "wouter";
import { FacebookIcon, InstagramIcon, TwitterIcon, PinterestIcon } from "@/assets/icons";

export default function Footer() {
  return (
    <footer className="bg-primary text-white py-10 safe-bottom">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center mb-4">
              <img src="/scheduled-pro-logo.png" alt="Scheduled Pro" className="h-6 w-auto mr-2" />
              <h3 className="text-xl font-bold">Scheduled Pro</h3>
            </div>
            <p className="mb-4 text-sm md:text-base">The ultimate scheduling platform for entrepreneurs across all service industries. Grow your business with our professional tools.</p>
            <div className="flex space-x-4">
              <div className="text-white hover:text-secondary transition-colors tap-highlight-none cursor-pointer" aria-label="Facebook">
                <FacebookIcon />
              </div>
              <div className="text-white hover:text-secondary transition-colors tap-highlight-none cursor-pointer" aria-label="Instagram">
                <InstagramIcon />
              </div>
              <div className="text-white hover:text-secondary transition-colors tap-highlight-none cursor-pointer" aria-label="Twitter">
                <TwitterIcon />
              </div>
              <div className="text-white hover:text-secondary transition-colors tap-highlight-none cursor-pointer" aria-label="Pinterest">
                <PinterestIcon />
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="grid grid-cols-2 md:grid-cols-1 gap-2 gap-y-3">
              <li>
                <Link href="/#services">
                  <div className="cursor-pointer hover:text-secondary transition-colors tap-highlight-none">
                    Services
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/booking">
                  <div className="cursor-pointer hover:text-secondary transition-colors tap-highlight-none">
                    Book Appointment
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/#reviews">
                  <div className="cursor-pointer hover:text-secondary transition-colors tap-highlight-none">
                    Reviews
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/#contact">
                  <div className="cursor-pointer hover:text-secondary transition-colors tap-highlight-none">
                    Contact Us
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/dashboard">
                  <div className="cursor-pointer hover:text-secondary transition-colors tap-highlight-none">
                    Business Portal
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/pricing">
                  <div className="cursor-pointer hover:text-secondary transition-colors tap-highlight-none">
                    Pricing
                  </div>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Stay Connected</h3>
            <p className="mb-4 text-sm md:text-base">Join our newsletter for business tips and special offers.</p>
            <form className="flex">
              <input 
                type="email" 
                placeholder="Your email" 
                className="px-4 py-2 rounded-l-md w-full focus:outline-none text-gray-700 text-sm"
                aria-label="Email for newsletter"
              />
              <button 
                type="submit" 
                className="bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-r-md transition-colors tap-highlight-none"
                aria-label="Subscribe"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
            <div className="mt-4 flex flex-col space-y-2">
              <div className="text-sm flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="text-sm flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>support@scheduled.app</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm md:text-base">&copy; {new Date().getFullYear()} Scheduled Pro. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <Link href="/privacy">
              <div className="text-sm text-primary-foreground/80 hover:text-white transition-colors cursor-pointer tap-highlight-none">
                Privacy Policy
              </div>
            </Link>
            <Link href="/terms">
              <div className="text-sm text-primary-foreground/80 hover:text-white transition-colors cursor-pointer tap-highlight-none">
                Terms of Service
              </div>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
