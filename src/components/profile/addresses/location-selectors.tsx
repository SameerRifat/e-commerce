// @/components/profile/addresses/location-selectors.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GetState, GetCity } from 'react-country-state-city';
import { State, City, PAKISTAN_COUNTRY } from './types';

interface CountrySelectProps {
    value: string;
    disabled?: boolean;
}

export const CountrySelect = ({ value, disabled = false }: CountrySelectProps) => {
    return (
        <Button
            variant="outline"
            className="w-full justify-between"
            disabled={disabled}
        >
            <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {PAKISTAN_COUNTRY.name}
            </div>
            <span className="text-xs text-muted-foreground">
                {PAKISTAN_COUNTRY.iso2}
            </span>
        </Button>
    );
};

interface StateSelectProps {
    value: string;
    onChange: (stateId: number, stateName: string) => void;
    onBlur?: () => void;
    disabled?: boolean;
}

export const StateSelect = ({ value, onChange, onBlur, disabled = false }: StateSelectProps) => {
    const [open, setOpen] = useState(false);
    const [states, setStates] = useState<State[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchStates = async () => {
            setLoading(true);
            try {
                const stateList = await GetState(PAKISTAN_COUNTRY.id);
                setStates(stateList || []);
            } catch (error) {
                console.error('Error fetching states:', error);
                setStates([]);
            } finally {
                setLoading(false);
            }
        };

        fetchStates();
    }, []);

    const selectedState = states.find((state) => state.id.toString() === value);

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        // Trigger onBlur when closing the popover
        if (!newOpen && onBlur) {
            onBlur();
        }
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled || loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Loading states...
                        </>
                    ) : selectedState ? (
                        selectedState.name
                    ) : (
                        "Select state..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder="Search state..." />
                    <CommandEmpty>
                        {states.length === 0 ? "No states available." : "No state found."}
                    </CommandEmpty>
                    <CommandGroup>
                        <ScrollArea className="h-60">
                            {states.map((state) => (
                                <CommandItem
                                    key={state.id}
                                    value={state.name}
                                    onSelect={() => {
                                        onChange(state.id, state.name);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === state.id.toString() ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {state.name}
                                </CommandItem>
                            ))}
                        </ScrollArea>
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

interface CitySelectProps {
    stateId: number | null;
    value: string;
    onChange: (cityId: number, cityName: string) => void;
    onBlur?: () => void;
    disabled?: boolean;
}

export const CitySelect = ({ stateId, value, onChange, onBlur, disabled = false }: CitySelectProps) => {
    const [open, setOpen] = useState(false);
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!stateId) {
            setCities([]);
            return;
        }

        const fetchCities = async () => {
            setLoading(true);
            try {
                const cityList = await GetCity(PAKISTAN_COUNTRY.id, stateId);
                setCities(cityList || []);
            } catch (error) {
                console.error('Error fetching cities:', error);
                setCities([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCities();
    }, [stateId]);

    const selectedCity = cities.find((city) => city.id.toString() === value);

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        // Trigger onBlur when closing the popover
        if (!newOpen && onBlur) {
            onBlur();
        }
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled || !stateId || loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Loading cities...
                        </>
                    ) : selectedCity ? (
                        selectedCity.name
                    ) : (
                        "Select city..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder="Search city..." />
                    <CommandEmpty>
                        {cities.length === 0 ? "No cities available for this state." : "No city found."}
                    </CommandEmpty>
                    <CommandGroup>
                        <ScrollArea className="h-60">
                            {cities.map((city) => (
                                <CommandItem
                                    key={city.id}
                                    value={city.name}
                                    onSelect={() => {
                                        onChange(city.id, city.name);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === city.id.toString() ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {city.name}
                                </CommandItem>
                            ))}
                        </ScrollArea>
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
};