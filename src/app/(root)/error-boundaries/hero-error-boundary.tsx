// src/app/(root)/error-boundaries/hero-error-boundary.tsx
'use client';

import { Component, type ReactNode } from 'react';
import { HeroError } from '@/components/error/hero-error';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class HeroErrorBoundary extends Component<Props, State> {
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
                <HeroError
                    error={this.state.error as Error & { digest?: string }}
                    reset={() => this.setState({ hasError: false, error: null })}
                />
            );
        }

        return this.props.children;
    }
}