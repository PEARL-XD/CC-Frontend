import Navbar from "./Navbar";
export default function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="min-w-0 w-full flex-grow">
        {children}
      </main>
    </div>
  );
}
