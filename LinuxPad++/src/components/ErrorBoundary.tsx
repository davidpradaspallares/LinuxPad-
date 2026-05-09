import React from "react";
import { useTranslation } from "../i18n";

interface Strings {
  title: string;
  retry: string;
}

interface State {
  hasError: boolean;
  message: string;
}

class ErrorBoundaryClass extends React.Component<React.PropsWithChildren<{ strings: Strings }>, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, message };
  }

  render() {
    if (this.state.hasError) {
      const { strings } = this.props;
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 bg-surface-900">
          <p className="text-sm font-semibold text-red-400">{strings.title}</p>
          <p className="text-xs max-w-sm text-center">{this.state.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, message: "" })}
            className="px-3 py-1 rounded bg-surface-700 hover:bg-surface-600 text-xs"
          >
            {strings.retry}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ErrorBoundary({ children }: React.PropsWithChildren) {
  const t = useTranslation();
  return (
    <ErrorBoundaryClass strings={t.errorBoundary}>
      {children}
    </ErrorBoundaryClass>
  );
}
