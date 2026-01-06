import EnhancedBreadcrumb from "@/components/ui/EnhancedBreadcrumb";
import DeepSeekChatbot from "@/components/Chatbot/DeepSeekChatbot";
import NavLinks from "./NavLinks";
import MobileNav from "./MobileNav";
import NavProfile from "./NavProfile";
import NavCompany from "./NavCompany";
import DarkModeSwitch from "@/components/DarkMode/DarkModeSwitch";

function Navbar() {
  return (
    <>
      <header className="sticky top-0 z-40 w-full transition-all duration-300 border-b border-slate-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md" id="main-navbar">
        <nav className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">

          {/* Left Section: Mobile Menu, Company Info & Branding */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Mobile Toggle */}
            <MobileNav />

            {/* Company Info */}
            <NavCompany />

            {/* Separator */}
            <div className="h-6 w-[1px] bg-slate-200 dark:bg-zinc-800 hidden md:block mx-1"></div>

            {/* Branding / Breadcrumbs */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:block">
                <EnhancedBreadcrumb />
              </div>
            </div>
          </div>

          {/* Desktop Navigation Centered (Flexible) */}
          <div className="hidden lg:flex flex-1 justify-center min-w-0">
            <NavLinks />
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0">
            <div className="hidden md:block">
              <DarkModeSwitch />
            </div>

            {/* Divider */}
            <div className="h-6 w-[1px] bg-slate-200 dark:bg-zinc-800 hidden md:block"></div>

            <NavProfile />
          </div>

        </nav>
      </header>
      <DeepSeekChatbot />
    </>
  );
}

export default Navbar;
