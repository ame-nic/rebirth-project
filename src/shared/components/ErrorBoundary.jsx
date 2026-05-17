import { Component } from "react";
import { C, FONT, btn, label } from "../design/tokens.js";

/* Catches any render error in a subtree and shows a Zeroth-styled fallback.
   On a phone PWA an uncaught throw whitescreens the app — and "force quit
   + relaunch" isn't a casual ask. The boundary keeps the rest of the app
   reachable when one tab misbehaves. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (typeof console !== "undefined") {
      console.error("[ErrorBoundary]", this.props.label || "", error, info?.componentStack);
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    const msg = this.state.error?.message || String(this.state.error);
    return (
      <div
        style={{
          padding: "32px 18px",
          color: C.txt, background: C.bg,
          fontFamily: FONT, minHeight: "60vh",
        }}
      >
        <div style={{ ...label, color: C.D, marginBottom: 6 }}>
          <span style={{ color: C.D }}>§</span>&nbsp;&nbsp;Errore
        </div>
        <div style={{ fontSize: 20, color: C.txt, lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 8 }}>
          Qualcosa è andato storto.
        </div>
        <div style={{ fontSize: 12, color: C.txtSec, lineHeight: 1.6, marginBottom: 16 }}>
          {this.props.label
            ? <>Si è verificato un errore nella sezione <strong>{this.props.label}</strong>.</>
            : "Si è verificato un errore inatteso."}
          <br />
          Gli altri pannelli dovrebbero funzionare normalmente.
        </div>
        <div
          style={{
            fontSize: 11, color: C.txtMute, lineHeight: 1.55,
            background: C.surf, border: `1px solid ${C.border}`,
            borderRadius: 4, padding: "10px 12px", marginBottom: 16,
            fontFamily: FONT, wordBreak: "break-word",
          }}
        >
          {msg}
        </div>
        <button onClick={this.reset} style={btn(C.A, C.bg)}>
          Riprova
        </button>
      </div>
    );
  }
}
