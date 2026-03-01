// This layout renders the login page WITHOUT the main app Sidebar/Header
// It simply wraps children in a full-screen container

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-50 bg-white">
            {children}
        </div>
    );
}
