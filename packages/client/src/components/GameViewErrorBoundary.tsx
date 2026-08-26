import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class GameViewErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Game view render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-2xl border border-red-500/40 bg-red-950/30 p-8 text-center">
            <p className="text-lg font-semibold text-red-200">Display error</p>
            <p className="mt-2 text-sm text-red-200/70">
              The game view hit a rendering problem. Host controls below still work — try pausing or ending the round.
            </p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
