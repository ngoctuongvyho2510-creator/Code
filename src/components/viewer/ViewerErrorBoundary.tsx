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
    console.group('Vehicle viewer runtime error')
    console.error(error)
    console.error('Error stack', error.stack ?? '(no stack available)')
    console.error('React component stack', errorInfo.componentStack)
    console.groupEnd()
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}
