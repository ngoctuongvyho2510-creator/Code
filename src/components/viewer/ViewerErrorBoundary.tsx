import { Component, type ErrorInfo, type ReactNode } from 'react'

type ViewerErrorBoundaryProps = {
  children: ReactNode
  fallback: ReactNode
}

type ViewerErrorBoundaryState = {
  hasError: boolean
}

export class ViewerErrorBoundary extends Component<
  ViewerErrorBoundaryProps,
  ViewerErrorBoundaryState
> {
  state: ViewerErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): ViewerErrorBoundaryState {
    return {
      hasError: true,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Vehicle model viewer error', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}
