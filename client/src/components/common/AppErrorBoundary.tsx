import { Component, type ReactNode } from "react";
export class AppErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main
          style={{
            minHeight: "100dvh",
            background: "#f4f7f8",
            color: "#132b36",
            display: "grid",
            placeContent: "center",
            padding: 32,
            fontFamily: "Outfit,sans-serif",
          }}
        >
          <div style={{ maxWidth: 430 }}>
            <h1 style={{ fontSize: 30, marginBottom: 16 }}>
              Let’s get you back on track.
            </h1>
            <p style={{ color: "#526c70", lineHeight: 1.7 }}>
              This page could not be loaded. Refresh to try again, or return to
              the campus homepage.
            </p>
            <div
              style={{
                display: "flex",
                gap: 20,
                alignItems: "center",
                marginTop: 24,
              }}
            >
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: "#1d7163",
                  color: "#fff",
                  border: 0,
                  borderRadius: 10,
                  padding: "12px 22px",
                  cursor: "pointer",
                }}
              >
                Refresh page
              </button>
              <a href="/" style={{ color: "#1d7163" }}>
                Back to campus
              </a>
            </div>
          </div>
        </main>
      );
    return this.props.children;
  }
}
