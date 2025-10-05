export default function PageFooter() {
  const links = [
    { label: "Data Policy", url: "https://www.rantir.com/company-services-policy" },
    { label: "Security", url: "https://www.rantir.com/security-policy" },
    { label: "Data Classification", url: "https://www.rantir.com/company-services-policy" },
    { label: "Terms & Conditions", url: "https://www.rantir.com/terms-and-conditions" },
    { label: "Privacy Policy", url: "https://www.rantir.com/privacy-policy" },
    { label: "License", url: "https://www.rantir.com/licensing" },
  ];

  return (
    <footer className="border-t mt-auto py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © Designtir is made by Rantir, Inc. (DBA Hexigon AI, INC.)
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
            {links.map((link, index) => (
              <span key={link.url} className="flex items-center gap-x-4">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
                {index < links.length - 1 && (
                  <span className="text-muted-foreground">•</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
