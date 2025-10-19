// src/app/(root)/error-boundaries/section-error-boundary.tsx
'use client';

import { Component, type ReactNode } from 'react';
import { SectionError } from '@/components/error/section-error';

interface Props {
    children: ReactNode;
    title?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class SectionErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError && this.state.error) {
            return (
                <SectionError
                    error={this.state.error as Error & { digest?: string }}
                    reset={() => this.setState({ hasError: false, error: null })}
                    title={this.props.title}
                />
            );
        }

        return this.props.children;
    }
}